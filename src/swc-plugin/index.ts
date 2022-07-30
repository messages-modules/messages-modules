// Waiting on : https://github.com/swc-project/swc/discussions/5298
// Could check: https://github.com/ankitchouhan1020/swc-plugin-transform-import
// Maybe it depends on a specific node version to work?

import { Module, plugins, Program, transformSync } from '@swc/core';
import Visitor from '@swc/core/Visitor.js';

class testVisitor extends Visitor {
  visitModule(module: Module): Module {
    module.body.forEach((content) => {
      console.dir(content);
    });

    return module;
  }
}

function testPlugin() {
  return (program: Program) => new testVisitor().visitProgram(program);
}

const input = `const hello = "world";`;

const output = transformSync(input, {
  plugin: plugins([testPlugin()]),
});

console.log(output);
