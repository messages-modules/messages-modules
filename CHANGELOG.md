

# [1.1.0](https://github.com/Avansai/messages-modules/compare/1.0.0...1.1.0) (2022-08-11)


### Code Refactoring

* add `eslint-plugin-unicorn` to help increase code quality ([41643ae](https://github.com/Avansai/messages-modules/commit/41643aef87910bd4785925260c44e6615a73716a))


### Features

* add named export support for shared messages ([630f1c1](https://github.com/Avansai/messages-modules/commit/630f1c12edd27682508a97695e18bf7934145727))


### BREAKING CHANGES

* Using the `node:` scheme to better identify Node.js modules requires more recent Node.js versions

# [1.0.0](https://github.com/Avansai/messages-modules/compare/0.0.3...1.0.0) (2022-08-01)

Official stable stable release.

## [0.0.3](https://github.com/Avansai/messages-modules/compare/0.0.2...0.0.3) (2022-07-25)

## 0.0.2 (2022-07-24)

### Bug Fixes

- remove unused dependencies ([0496731](https://github.com/Avansai/messages-modules/commit/04967313806e102dde010af1d8716d952a0d260a))

### Features

- first working Babel plugin ([d58b0d3](https://github.com/Avansai/messages-modules/commit/d58b0d343b2d9d6eaf543378fa2c184bf58e8b3a))
- remove namespace import support to simplify the plugin ([6ab7e3c](https://github.com/Avansai/messages-modules/commit/6ab7e3cbc622bcae5115fd6a5baad8afaa608dc0))

### BREAKING CHANGES

- There was a bug that would have needed to be fixed around namespace imports but since there is no real season to use this, its better to just drop this feature.