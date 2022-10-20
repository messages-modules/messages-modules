// @ts-nocheck
import { getMessages } from 'messages-modules'
import { getMessages as getMessages2 } from 'messages-modules'
import { getMessages as getMessages3, someFunction, getMessages as getMessages4 } from 'messages-modules'

const _messages = 'using the same variable name used to inject message to test collisions'
console.dir(_messages)
someFunction(true)

const getMessagesCopy = getMessages
const getMessagesArray = [ getMessages, getMessages, getMessages ]

console.dir(getMessagesArray)
console.dir(getMessages('en-US'))
console.dir(getMessages2('fr-CA'))
console.dir(getMessages3('fr-CA'))
console.dir(getMessages4('fr-CA'))
console.dir(getMessagesCopy('en-US'))
