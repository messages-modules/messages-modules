import { propertiesToJson } from 'properties-file'

import { HijackTarget, KeyValueObject, messageModulePlugin } from '../'

import type { PluginObj } from '@babel/core'

/**
 * Targets to hijack.
 */
export const hijackTargets: HijackTarget[] = [
  {
    module: 'messages-modules',
    function: 'getMessages',
  },
]

/**
 * Get messages from properties file.
 *
 * @param propertiesFilePath - The path of the .properties file from which to read the messages.
 *
 * @returns A "key/value" object storing messages where the key only contains the identifier segment of the key.
 */
export function getMessages(propertiesFilePath: string): KeyValueObject {
  return propertiesToJson(propertiesFilePath)
}

/**
 * This an example Babel plugin.
 *
 * This plugin will inject all the files that contains the targets to hijack with localized messages.
 *
 * @returns A Babel plugin object.
 */
export default function plugin(): PluginObj {
  return messageModulePlugin(hijackTargets, 'properties', getMessages)
}
