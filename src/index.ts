import { readdirSync } from 'fs';
import { parse, sep as pathSeparator } from 'path';

import template from '@babel/template';
import * as BabelTypes from '@babel/types';

import type { PluginObj, PluginPass, NodePath } from '@babel/core';
export type Program = BabelTypes.Program;
export type Statement = BabelTypes.Statement;
export type ImportDeclaration = BabelTypes.ImportDeclaration;
export type ImportSpecifier = BabelTypes.ImportSpecifier;
export type ImportNamespaceSpecifier = BabelTypes.ImportNamespaceSpecifier;
export type ImportDefaultSpecifier = BabelTypes.ImportDefaultSpecifier;
export type Identifier = BabelTypes.Identifier;

const isImportSpecifier = BabelTypes.isImportSpecifier;

/**
 * Escapes a regular expression string.
 *
 * @param regexp - The regular expression string.
 *
 * @returns An escaped regular expression.
 */
function escapeRegExp(regexp: string): string {
  return regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Target to hijack.
 */
export type HijackTarget = {
  module: string;
  function: string;
};

/**
 * A simple "key/value" object used to store messages.
 */
export type KeyValueObject = {
  [key: string]: string;
};

/**
 * A collection of "key/value" objects for for all locales.
 */
export type KeyValueObjectCollection = {
  [key: string]: KeyValueObject;
};

export class InjectedMessages {
  /** This property is used to confirm that the messages have been injected. */
  readonly isInjected = true;
  /** The path of the source file that is invoking `useMessages`. */
  readonly sourceFilePath: string;
  /** A collection of "key/value" objects for for all locales. */
  keyValueObjectCollection: KeyValueObjectCollection = {};

  /**
   * The injected localized messages.
   *
   * @param sourceFilePath - The path of the source file.
   */
  constructor(sourceFilePath: string) {
    this.sourceFilePath = sourceFilePath;
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
function getInjectedMessages(
  sourceFilePath: string,
  messagesFileExtension: string,
  getMessages: (messagesFilePath: string) => KeyValueObject
): string {
  const parsedSourceFile = parse(sourceFilePath);
  const sourceFileDirectoryPath = parsedSourceFile.dir;
  const sourceFilename = parsedSourceFile.name;
  const injectedMessages = new InjectedMessages(sourceFilePath);

  const fileRegExp = new RegExp(
    `^${escapeRegExp(sourceFilename)}.(?<locale>[\\w-]+).${messagesFileExtension}$`
  );

  readdirSync(sourceFileDirectoryPath, { withFileTypes: true }).forEach((directoryEntry) => {
    if (directoryEntry.isFile()) {
      const directoryEntryFilename = directoryEntry.name;
      const regExpMatch = directoryEntryFilename.match(fileRegExp);
      if (regExpMatch?.groups) {
        const locale = regExpMatch.groups.locale;
        const messagesFilePath = sourceFileDirectoryPath.length
          ? `${sourceFileDirectoryPath}/${directoryEntryFilename}`
          : directoryEntryFilename;
        injectedMessages.keyValueObjectCollection[locale.toLowerCase()] =
          getMessages(messagesFilePath);
      }
    }
  });

  return JSON.stringify(injectedMessages);
}

/**
 * Verify if an import declaration node matches the target module.
 *
 * @param nodePath - A node path object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the node matches, otherwise false.
 */
function isMatchingModule(nodePath: NodePath, hijackTarget: HijackTarget): boolean {
  if (!nodePath.isImportDeclaration()) return false;
  if (nodePath.node.source.value !== hijackTarget.module) return false;
  return true;
}

/**
 * Verify if a specifier matches the target function.
 *
 * @param specifier - A specifier object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the specifier matches, otherwise false.
 */
function isMatchingModuleImportName(
  specifier: ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier,
  hijackTarget: HijackTarget
): boolean {
  return (
    isImportSpecifier(specifier) &&
    (specifier.imported as Identifier).name === hijackTarget.function
  );
}

/**
 * Verify if an import declaration node matches the target module and function.
 *
 * @param nodePath - A node path object.
 * @param hijackTarget - The target to hijack.
 *
 * @returns True is the node matches, otherwise false.
 */
function isMatchingNamedImport(nodePath: NodePath, hijackTarget: HijackTarget): boolean {
  return (
    isMatchingModule(nodePath, hijackTarget) &&
    (nodePath.node as ImportDeclaration).specifiers.some((specifier) =>
      isMatchingModuleImportName(specifier, hijackTarget)
    )
  );
}

class Messages {
  /** The program node path associated with the class. */
  private programNodePath: NodePath<Program>;
  /** The source file path associated with the class. */
  private sourceFilePath: string;
  /** The file extension of the messages file. */
  private messagesFileExtension: string;
  /** The function used to get the messages. */
  private getMessages: (messagesFilePath: string) => KeyValueObject;

  /** The number of time the `getVariableName` was called. */
  private getVariableNameCount = 0;
  /** The unique variable name used relative to the program node path. */
  private variableName: string;

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
    this.programNodePath = programNodePath;

    const leadingPathSeparatorRegExp = new RegExp(`^${escapeRegExp(pathSeparator)}`);

    // this.sourceFilePath = (pluginPass as PluginPass).file.opts.filename
    const pluginPassFilename = pluginPass.file.opts?.filename;

    if (typeof pluginPassFilename !== 'string') {
      throw new Error('error getting the name of the file during compilation');
    }

    this.sourceFilePath = pluginPassFilename
      .replace(process.cwd(), '') // Remove absolute portion of the path to make is "app-root-relative".
      .replace(leadingPathSeparatorRegExp, ''); // Remove leading path separator (e.g., '/') if present.

    if (pathSeparator !== '/') {
      // Normalize path separators to `/`.
      const separatorRegExp = new RegExp(`${escapeRegExp(pathSeparator)}`, 'g');
      this.sourceFilePath = this.sourceFilePath.replace(separatorRegExp, '/');
    }

    this.messagesFileExtension = messagesFileExtension;
    this.getMessages = getMessages;

    this.variableName = this.programNodePath.scope.generateUidIdentifier('messages').name;
  }

  /**
   * Get the unique variable name used relative to the program node path.
   */
  public getVariableName(): string {
    this.getVariableNameCount++;
    return this.variableName;
  }

  /**
   * Inject the messages to the program node path, if the variable name was used.
   */
  public injectIfMatchesFound(): void {
    if (!this.getVariableNameCount) return;

    // Inject the messages at the beginning o the file.
    this.programNodePath.node.body.unshift(
      template.ast(
        `const ${this.variableName} = ${getInjectedMessages(
          this.sourceFilePath,
          this.messagesFileExtension,
          this.getMessages
        )};`
      ) as Statement
    );
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
function getVariableName(nodePath: NodePath, hijackTarget: HijackTarget, suffix: string): string {
  return nodePath.scope.generateUidIdentifier(`${hijackTarget.function}${suffix}`).name;
}

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
function hijackNamedImport(
  nodePath: NodePath<ImportDeclaration>,
  hijackTarget: HijackTarget,
  messages: Messages
): void {
  const node = nodePath.node;

  node.specifiers.forEach((specifier) => {
    if (isMatchingModuleImportName(specifier, hijackTarget)) {
      // This is the scope-unique variable name that will replace all matching function bindings.
      const hijackedFunction = getVariableName(nodePath, hijackTarget, 'Function');

      const currentName = specifier.local.name;

      // Rename all bindings with the the new name (this excludes the import declaration).
      const binding = nodePath.scope.getBinding(currentName);

      if (!binding) {
        return; // If there is no binding, no need to hijack.
      }

      binding.referencePaths.forEach((referencePath) => {
        referencePath.scope.rename(currentName, hijackedFunction, referencePath.parent);
      });

      // Insert the new "hijacked" namespace variable, with the correct binding.
      nodePath.insertAfter(
        template.ast(
          `const ${hijackedFunction} = ${currentName}.bind(${messages.getVariableName()});`
        ) as Statement
      );
    }
  });
}

/**
 * Dynamically returns a plugin based on the specified parameters.
 *
 * @param messagesFileExtension - The file extension of the messages file.
 * @param getMessages - The function used to get the messages.
 *  */
export function messageModulePlugin(
  hijackTargets: HijackTarget[],
  messagesFileExtension: string,
  getMessages: (messagesFilePath: string) => KeyValueObject
): PluginObj {
  return {
    visitor: {
      Program(programNodePath: NodePath<Program>, pluginPass: PluginPass) {
        const messages = new Messages(
          programNodePath,
          pluginPass,
          messagesFileExtension,
          getMessages
        );

        (programNodePath.get('body') as NodePath[]).forEach((bodyNodePath) => {
          hijackTargets.forEach((hijackTarget) => {
            if (isMatchingNamedImport(bodyNodePath, hijackTarget)) {
              hijackNamedImport(
                bodyNodePath as NodePath<ImportDeclaration>,
                hijackTarget,
                messages
              );
            }
          });
        });

        messages.injectIfMatchesFound();
      },
    },
  };
}

/**
 * Get the injected localized messages in a local scope.
 *
 * @param locale - The locale of the message file.
 *
 * @returns A simple key/value object with the messages.
 */
export function getMessages(locale: string): KeyValueObject {
  // @ts-expect-error: `this` is injected using `bind` and will trigger a false compilation error.
  const injectedMessages = this as InjectedMessages;
  if (!injectedMessages || !injectedMessages.isInjected) {
    throw new Error(`a messages-module plugin must be configured`);
  }
  const messages = injectedMessages.keyValueObjectCollection[locale.toLowerCase()];
  return !messages ? {} : messages;
}
