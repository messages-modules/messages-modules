import { readdirSync } from 'node:fs'
import path from 'node:path'

import template from '@babel/template'
import * as BabelTypes from '@babel/types'

import type { NodePath, PluginObj, PluginPass } from '@babel/core'

export type Program = BabelTypes.Program
export type Statement = BabelTypes.Statement
export type ExportNamedDeclaration = BabelTypes.ExportNamedDeclaration
export type ExportSpecifier = BabelTypes.ExportSpecifier
export type ExportNamespaceSpecifier = BabelTypes.ExportNamespaceSpecifier
export type ExportDefaultSpecifier = BabelTypes.ExportDefaultSpecifier
export type ImportDeclaration = BabelTypes.ImportDeclaration
export type ImportSpecifier = BabelTypes.ImportSpecifier
export type ImportNamespaceSpecifier = BabelTypes.ImportNamespaceSpecifier
export type ImportDefaultSpecifier = BabelTypes.ImportDefaultSpecifier
export type Identifier = BabelTypes.Identifier

const isExportSpecifier = BabelTypes.isExportSpecifier
const isImportSpecifier = BabelTypes.isImportSpecifier
const isIdentifier = BabelTypes.isIdentifier

/**
 * Escapes a regular expression string.
 *
 * @param regexp - The regular expression string.
 *
 * @returns An escaped regular expression.
 */
const escapeRegExp = (regexp: string): string =>
  regexp.replace(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`)

/**
 * A target to hijack.
 *
 * A target to hijack (inject messages) must be identified by both a `function` and the `module` it's being
 * imported from. For example:
 *
 * `import { getMessages } from 'messages-modules'`
 *
 * The function is `getMessages` and the module is `messages-modules`
 */
export type HijackTarget = {
  /** The name of a function to hijack (e.g., `getMessages`). */
  function: string
  /** The function's module used to import it. */
  module: string
}

/**
 * A simple "key/value" object used to store messages.
 */
export type KeyValueObject = {
  [key: string]: string
}

/**
 * A collection of "key/value" objects for for all locales.
 */
export type KeyValueObjectCollection = {
  [key: string]: KeyValueObject
}

export class InjectedMessages {
  /** This property is used to confirm that the messages have been injected. */
  readonly isInjected = true
  /** A collection of "key/value" objects for for all locales. */
  keyValueObjectCollection: KeyValueObjectCollection = {}
  /** The path of the source file that is invoking `useMessages`. */
  readonly sourceFilePath: string

  /**
   * The injected localized messages.
   *
   * @param sourceFilePath - The path of the source file.
   */
  constructor(sourceFilePath: string) {
    this.sourceFilePath = sourceFilePath
  }
}

/**
 * Get the injected multilingual message collection associated with a source file.
 *
 * @param sourceFilePath - The path of the source file.
 * @param messagesFileExtension - The file extension of the messages file.
 * @param getMessages - The function used to get the messages.
 *
 * @returns The injected multilingual messages collection in string format.
 */
const getInjectedMessages = (
  sourceFilePath: string,
  messagesFileExtension: string,
  getMessages: (messagesFilePath: string) => KeyValueObject
): string => {
  const parsedSourceFile = path.parse(sourceFilePath)
  const sourceFileDirectoryPath = parsedSourceFile.dir
  const sourceFilename = parsedSourceFile.name
  const injectedMessages = new InjectedMessages(sourceFilePath)

  const fileRegExp = new RegExp(
    `^${escapeRegExp(sourceFilename)}.(?<locale>[\\w-]+).${messagesFileExtension}$`
  )

  readdirSync(sourceFileDirectoryPath, { withFileTypes: true }).forEach((directoryEntry) => {
    if (directoryEntry.isFile()) {
      const directoryEntryFilename = directoryEntry.name
      const regExpMatch = directoryEntryFilename.match(fileRegExp)
      if (regExpMatch?.groups) {
        const locale = regExpMatch.groups.locale
        const messagesFilePath =
          sourceFileDirectoryPath.length > 0
            ? `${sourceFileDirectoryPath}/${directoryEntryFilename}`
            : directoryEntryFilename
        injectedMessages.keyValueObjectCollection[locale.toLowerCase()] =
          getMessages(messagesFilePath)
      }
    }
  })

  return JSON.stringify(injectedMessages)
}

/**
 * Verify if an import or export statement matches the target module.
 *
 * @param nodePath - A node path object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the module matches, otherwise false.
 */
const isMatchingModule = (
  nodePath: NodePath<BabelTypes.ImportDeclaration> | NodePath<BabelTypes.ExportNamedDeclaration>,
  hijackTarget: HijackTarget
): boolean => !!nodePath.node.source && nodePath.node.source.value === hijackTarget.module

/**
 * Verify if an import or export statement matches the target function.
 *
 * @param nodePath - A node path object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the function matches, otherwise false.
 */
const isMatchingFunction = (
  nodePath: NodePath<ImportDeclaration> | NodePath<ExportNamedDeclaration>,
  hijackTarget: HijackTarget
): boolean =>
  nodePath.node.specifiers.some((specifier) => {
    return (
      (isImportSpecifier(specifier) && isMatchingImportFunction(specifier, hijackTarget)) ||
      (isExportSpecifier(specifier) && isMatchingExportFunction(specifier, hijackTarget))
    )
  })

/**
 * Verify if an import specifier matches the target function.
 *
 * @param specifier - An import specifier object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the module matches, otherwise false.
 */
const isMatchingImportFunction = (
  specifier: ImportSpecifier,
  hijackTarget: HijackTarget
): boolean => isIdentifier(specifier.imported) && specifier.imported.name === hijackTarget.function

/**
 * Verify if an export specifier matches the target function.
 *
 * @param specifier - An export specifier object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the module matches, otherwise false.
 */
const isMatchingExportFunction = (
  specifier: ExportSpecifier,
  hijackTarget: HijackTarget
): boolean => isIdentifier(specifier.local) && specifier.local.name === hijackTarget.function

/**
 * Verify if a named export declaration node matches the target module and function.
 *
 * @param nodePath - A node path object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the node matches, otherwise false.
 */
const isMatchingNamedExport = (nodePath: NodePath, hijackTarget: HijackTarget): boolean =>
  nodePath.isExportNamedDeclaration() &&
  isMatchingFunction(nodePath, hijackTarget) &&
  isMatchingModule(nodePath, hijackTarget)

/**
 * Verify if an import declaration node matches the target module and function.
 *
 * @param nodePath - A node path object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the node matches, otherwise false.
 */
const isMatchingNamedImport = (nodePath: NodePath, hijackTarget: HijackTarget): boolean =>
  nodePath.isImportDeclaration() &&
  isMatchingFunction(nodePath, hijackTarget) &&
  isMatchingModule(nodePath, hijackTarget)

class Messages {
  /** The function used to get the messages. */
  private getMessages: (messagesFilePath: string) => KeyValueObject
  /** The number of time the `getVariableName` was called. */
  private getVariableNameCount = 0
  /** The file extension of the messages file. */
  private messagesFileExtension: string
  /** The program node path associated with the class. */
  private programNodePath: NodePath<Program>
  /** The source file path associated with the class. */
  private sourceFilePath: string
  /** The unique variable name used relative to the program node path. */
  private variableName: string

  /**
   * The localized messages.
   *
   * @param programNodePath - The program node path associated with the class.
   * @param pluginPass - The `PluginPass` object associated with the class.
   * @param messagesFileExtension - The file extension of the messages file.
   * @param getMessages - The function used to get the messages.
   */
  constructor(
    programNodePath: NodePath<Program>,
    pluginPass: PluginPass,
    messagesFileExtension: string,
    getMessages: (messagesFilePath: string) => KeyValueObject
  ) {
    this.programNodePath = programNodePath

    const leadingPathSeparatorRegExp = new RegExp(`^${escapeRegExp(path.sep)}`)

    // this.sourceFilePath = (pluginPass as PluginPass).file.opts.filename
    const pluginPassFilename = pluginPass.file.opts?.filename

    if (typeof pluginPassFilename !== 'string') {
      throw new Error('error getting the name of the file during compilation')
    }

    this.sourceFilePath = pluginPassFilename
      .replace(process.cwd(), '') // Remove absolute portion of the path to make is "app-root-relative".
      .replace(leadingPathSeparatorRegExp, '') // Remove leading path separator (e.g., '/') if present.

    if (path.sep !== '/') {
      // Normalize path separators to `/`.
      const separatorRegExp = new RegExp(`${escapeRegExp(path.sep)}`, 'g')
      this.sourceFilePath = this.sourceFilePath.replace(separatorRegExp, '/')
    }

    this.messagesFileExtension = messagesFileExtension
    this.getMessages = getMessages

    this.variableName = this.programNodePath.scope.generateUidIdentifier('messages').name
  }

  /**
   * Get the unique variable name used relative to the program node path.
   */
  public getVariableName(): string {
    this.getVariableNameCount++
    return this.variableName
  }

  /**
   * Inject the messages to the program node path, if the variable name was used.
   */
  public injectIfMatchesFound(): void {
    if (!this.getVariableNameCount) {
      return
    }

    // Inject the messages at the beginning o the file.
    this.programNodePath.node.body.unshift(
      template.ast(
        `const ${this.variableName} = ${getInjectedMessages(
          this.sourceFilePath,
          this.messagesFileExtension,
          this.getMessages
        )};`
      ) as Statement
    )
  }
}

/**
 * Get a variable name to hijack either a named import or a namespace import.
 *
 * @param nodePath - The node path from which to get the unique variable name.
 * @param hijackTarget - The target to hijack.
 * @param suffix - The suffix of the variable name.
 *
 * @returns A unique variable name in the node path's scope.
 */
const getVariableName = (nodePath: NodePath, hijackTarget: HijackTarget, suffix: string): string =>
  nodePath.scope.generateUidIdentifier(`${hijackTarget.function}${suffix}`).name

/**
 * "Hijack" a named import (e.g., `import { useMessages } from`).
 *
 * This will simply bind the named import to the injected messages, on a new function name. All bindings
 * of the original function will replaced by the hijacked function.
 *
 * @param nodePath - The node path being hijacked.
 * @param hijackTarget - The target to hijack.
 * @param messages - The object used to conditionally inject messages.
 */
const hijackNamedImport = (
  nodePath: NodePath<ImportDeclaration>,
  hijackTarget: HijackTarget,
  messages: Messages
): void => {
  const node = nodePath.node

  node.specifiers.forEach((specifier) => {
    if (isImportSpecifier(specifier) && isMatchingImportFunction(specifier, hijackTarget)) {
      // The current function name used in the local scope.
      const currentName = specifier.local.name

      // This is the scope-unique variable name that will replace all matching function bindings.
      const hijackedFunction = getVariableName(nodePath, hijackTarget, 'Function')

      // Rename all bindings with the the new name (this excludes the import declaration).
      const binding = nodePath.scope.getBinding(currentName)

      if (!binding || binding.referencePaths.length === 0) {
        return // If the function is unused (no binding), no need to hijack.
      }

      binding.referencePaths.forEach((referencePath) => {
        // We used `scope.rename` before but is caused conflicts between array expressions and import statements.
        if (referencePath.isIdentifier()) {
          referencePath.node.name = hijackedFunction
        }
      })

      // Insert the new "hijacked" variable, with the correct binding.
      nodePath.insertAfter(
        template.ast(
          `const ${hijackedFunction} = ${currentName}.bind(${messages.getVariableName()});`
        ) as Statement
      )
    }
  })
}

/**
 * "Hijack" a named export (e.g., `export { useMessages } from`).
 *
 * For every named export, we will create an import statement to which we will create a new hijacked function
 * that will then be re-exported using the original name. If all named exports of a statement are hijacked, the
 * export statement will be removed.
 *
 * @param nodePath - The node path being hijacked.
 * @param hijackTarget - The target to hijack.
 * @param messages - The object used to conditionally inject messages.
 */
const hijackNamedExport = (
  nodePath: NodePath<ExportNamedDeclaration>,
  hijackTarget: HijackTarget,
  messages: Messages
): void => {
  const node = nodePath.node

  ;[...node.specifiers].reverse().forEach((specifier, index, specifiersCopy) => {
    if (
      isExportSpecifier(specifier) &&
      isMatchingExportFunction(specifier, hijackTarget) &&
      isIdentifier(specifier.exported)
    ) {
      // Remove the matching specifier from the export as we will hijack it.
      node.specifiers.splice(specifiersCopy.length - 1 - index, 1)

      // The current function name used when exporting.
      const currentName = specifier.exported.name

      // This is the scope-unique variable name that will be used to perform the hijack.
      const hijackedImport = getVariableName(nodePath, hijackTarget, 'Function')
      const hijackedExport = getVariableName(nodePath, hijackTarget, 'Function')

      /**
       * Start by inserting a new `require` statement to import the function under a new unique "hijacked" name.
       *
       * ⚠️ Note: when trying to use `import` instead of `require`, it caused unexpected Next.js compilation issues:
       *
       * `error - ReferenceError: _useMessagesFunction is not defined`
       */
      const importStatement = template.ast(
        `const { ${hijackTarget.function}: ${hijackedImport} } = require('${hijackTarget.module}');`
      ) as Statement
      const [importStatementPath] = nodePath.insertAfter(importStatement)
      nodePath.parentPath.scope.registerDeclaration(importStatementPath)

      // Insert a new unique variable that will be used to export the messages.
      const hijackStatement = template.ast(
        `const ${hijackedExport} = ${hijackedImport}.bind(${messages.getVariableName()});`
      ) as Statement

      const [hijackStatementPath] = importStatementPath.insertAfter(hijackStatement)
      // ⚠️ Registering this specific declaration seems to avoid Next.js warnings on startup.
      nodePath.parentPath.scope.registerDeclaration(hijackStatementPath)

      // Insert the new export statement using the "hijacked" export name.
      const exportStatement = template.ast(
        `export { ${hijackedExport} as ${currentName} };`
      ) as Statement

      const [exportStatementPath] = hijackStatementPath.insertAfter(exportStatement)
      nodePath.scope.registerDeclaration(exportStatementPath)
    }
  })

  // If the entire export statement was hijacked (it is now empty), we can remove it.
  if (node.specifiers.length === 0) {
    nodePath.remove()
  }
}

/**
 * Dynamically returns a plugin based on the specified parameters.
 *
 * @param messagesFileExtension - The file extension of the messages file.
 * @param getMessages - The function used to get the messages.
 */
export const messageModulePlugin = (
  hijackTargets: HijackTarget[],
  messagesFileExtension: string,
  getMessages: (messagesFilePath: string) => KeyValueObject
): PluginObj => ({
  visitor: {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    Program: (programNodePath: NodePath<Program>, pluginPass: PluginPass) => {
      const messages = new Messages(programNodePath, pluginPass, messagesFileExtension, getMessages)

      void (programNodePath.get('body') as NodePath[]).forEach((bodyNodePath) => {
        hijackTargets.forEach((hijackTarget) => {
          // Try to hijack matching named import statements.
          if (isMatchingNamedImport(bodyNodePath, hijackTarget)) {
            hijackNamedImport(bodyNodePath as NodePath<ImportDeclaration>, hijackTarget, messages)
          }
          // Try to hijack matching named export statements.
          if (isMatchingNamedExport(bodyNodePath, hijackTarget)) {
            hijackNamedExport(
              bodyNodePath as NodePath<ExportNamedDeclaration>,
              hijackTarget,
              messages
            )
          }
        })
      })

      messages.injectIfMatchesFound()
    },
  },
})

/**
 * Get the injected localized messages in a local scope.
 *
 * @param locale - The locale of the message file.
 *
 * @returns A simple key/value object with the messages.
 */
export function getMessages(locale: string): KeyValueObject {
  // @ts-expect-error: `this` is injected using `bind` and will trigger a false compilation error.
  const injectedMessages = this as InjectedMessages
  if (!injectedMessages || !injectedMessages.isInjected) {
    throw new Error(`a messages-module plugin must be configured`)
  }
  return injectedMessages.keyValueObjectCollection[locale.toLowerCase()] ?? {}
}
