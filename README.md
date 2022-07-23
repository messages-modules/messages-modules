# messages-modules

[![License](https://img.shields.io/npm/l/make-coverage-badge.svg)](https://opensource.org/licenses/MIT)
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

## Why messages modules?

Most Node.js internationalization (i18n) libraries today either come with monolithic files to store all localized messages, or they include the concept of "namespaces" to break down messages in smaller files.

But think about it, do we put all CSS in a single file? Or all HTMl markup in a single file? Why would it be any different for localized messages.

Ultimately messages are content that can be use in a given context and making it modular optimizes both its management (see [proximity principle](https://kula.blog/posts/proximity_principle/)) while making client bundles size smaller (faster apps!)
