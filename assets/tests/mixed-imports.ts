// @ts-nocheck
import { getMessages } from 'messages-modules';
import { getMessages as getMessages2 } from 'messages-modules';
import { getMessages as getMessages3, getMessages as getMessages4 } from 'messages-modules';

const _messages = 'using the same variable name to test collision during injection';

const getMessagesCopy = getMessages;

console.dir(getMessages('en-US'));
console.dir(getMessages2('fr-CA'));
console.dir(getMessages3('fr-CA'));
console.dir(getMessages4('fr-CA'));
console.dir(getMessagesCopy('en-US'));
