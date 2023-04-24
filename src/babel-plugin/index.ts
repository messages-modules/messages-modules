import type { PluginObj } from '@babel/core'
import { readFileSync } from 'node:fs'
import { getProperties } from 'properties-file'
import { HijackTarget, KeyValueObject, messageModulePlugin } from '../'

/**
 * Targets to hijack.
 */
export const hijackTargets: HijackTarget[] = [
  {
    function: 'getMessages',
    module: 'messages-modules',
  },
]

/**
 * Get messages from properties file.
 *
 * @param propertiesFilePath - The path of the .properties file from which to read the messages.
 *
 * @returns A "key/value" object storing messages where the key only contains the identifier segment of the key.
 */
export const getMessages = (propertiesFilePath: string): KeyValueObject =>
  getProperties(readFileSync(propertiesFilePath))

/**
 * This an example Babel plugin.
 *
 * This plugin will inject all the files that contains the targets to hijack with localized messages.
 *
 * @returns A Babel plugin object.
 */
const plugin = (): PluginObj => messageModulePlugin(hijackTargets, 'properties', getMessages)

export default plugin
