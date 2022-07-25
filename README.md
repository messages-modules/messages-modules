# messages-modules

[![License](https://img.shields.io/npm/l/make-coverage-badge.svg)](https://opensource.org/licenses/MIT)
[![npm download](https://img.shields.io/npm/dw/resolve-accept-language.svg)](https://www.npmjs.com/package/messages-modules)
![Dependencies](https://img.shields.io/badge/dependencies-0-green)
[![Known Vulnerabilities](https://snyk.io/test/github/Avansai/messages-modules/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Avansai/messages-modules?targetFile=package.json)

Messages (localized strings) that are scoped locally.

## Installation 💻

Add the package as a dependency:

```
npm install messages-modules
```

## What's in it for me? 🤔

- Modular messages (also known as "localized strings") that work just like [CSS modules](https://github.com/css-modules/css-modules) (no more monolithic files).
- Build-time plugins for popular compilers ([Babel](https://babeljs.io/) & [SWC](https://swc.rs/)).

## Who is this for? 👥

> ⚠️ Note that while this package offers simplistic plugin implementations of `messages-modules`, we do not recommend using them as-is.

We have 2 audiences in mind: internationalization (i18n) packages or advanced users who built their own i18n library in their projects.

Building an i18n library is not a simple task, as a lot of linguistics aspects (e.g., [multi-plurals](https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html), [inline markup](https://github.com/Avansai/next-multilingual#injecting-jsx)) are easy to get wrong. `messages-module` has been built with customization in mind, as you can:

- Configure which file type you would like to use.
- Configure which function calls will require injected messages.
- Build your own function call that will parse the files so that you can have your own parsing logic.

If you are interested to see a mature i18n library using `messages-modules`, check out [`next-multilingual`](https://github.com/Avansai/next-multilingual).

## How does it work? 🧬

In a nutshell, `messages-module` relies on compiler plugins to inject messages automatically to avoid writing a lot of boilerplate code like this:

```ts
import enUs from './my-file.en-US.json';
import frCa from './my-file.fr-CA.json';
// .. imagine 20 other languages (imports) here depending on your project...

import { Messages } from './messages';

const messages = new Messages([enUs, frCa /** the list goes on... */]);

console.log(messages.format('en-US', 'greeting'));
```

Now imagine a React application where you have to add this boilerplate code in all your files using messages... And imagine add/removing languages. This is just a disaster waiting to happen.

What we are proposing instead is this simplified syntax, by injecting messages automatically in the functions you want:

```ts
import { getMessages } from './messages';

const messages = getMessages();

console.log(messages.format('en-US', 'greeting'));
```

To keep this simple, the `message-modules` plugins only support **named imports** which means that **namespace imports**, **dynamic imports** and **require imports** are out of scope:

👍 **named imports**

```ts
import { getMessages } from 'messages-modules';
```

👎 **namespace imports**

```ts
import * as messagesModules from 'messages-modules';
```

👎 **dynamic imports**

```ts
const { getMessages } = await import('messages-modules');
```

👎 **require imports**

```ts
const messagesModules = require('messages-modules');
```

## Why messages modules? 🤷

Most Node.js internationalization (i18n) libraries today either come with monolithic files to store all localized messages, or they include the concept of "namespaces" to break down messages in smaller files.

But think about it, do we put all CSS in a single file? Or all HTML markup in a single file? Why would it be any different for localized messages.

Ultimately messages are content that can be use in a given context and making it modular optimizes both its management (see [proximity principle](https://kula.blog/posts/proximity_principle/)) while making client bundles size smaller (faster apps!)
