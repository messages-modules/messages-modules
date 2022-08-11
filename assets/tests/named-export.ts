// @ts-nocheck

// Test 1: Exporting an import (this is not using the "name export" hijack)
import { getMessages } from 'messages-modules'

export const sharedMessages = getMessages

// Test 2: Exporting a "named export" that has the same name as the import
export { getMessages } from 'messages-modules'

// Test 3: Exporting a "name export" using a specific name
export { getMessages as getMessages2 } from 'messages-modules'

// Test 4: Multiple named export, with only 1 left not being hijacked (export statement should remain for 1)
export { getMessages as getMessages3, someOtherFunction, getMessages as getMessages4} from 'messages-modules'

// Test 5: Multiple named export, all being hijacked (export statement should be deleted)
export { getMessages as getMessages5, getMessages as getMessages6, getMessages as getMessages7} from 'messages-modules'
