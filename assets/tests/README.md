# Writing Tests

To write tests yoo can create a new TypeScript file accompanied with it's messages files and verify that the output of the plugin is as expected.

A useful tool to use when parsing these file is the [AST Explorer](https://astexplorer.net/) that can help you view how the code is parsed by the plugin.


## Useful commands

To test plugin changes, on existing tests:

```console
npm run build
```

To manually view the Babel output applied over a test file:

```console
npx babel assets/tests/your-file-name.ts
```
