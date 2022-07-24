import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const testAssets = ['./assets/tests/named-import', './assets/tests/mixed-imports'];

/**
 * Normalize the output of shell commands.
 *
 * @param output - The output of a shell command.
 *
 * @returns The normalized output of a shell command.
 */
function normalizeCommandOutput(output: string | Buffer): string {
  let normalizedOutput: string;

  if (Buffer.isBuffer(output)) {
    normalizedOutput = output.toString();
  } else {
    normalizedOutput = output;
  }
  return normalizedOutput.trim().replace(new RegExp('\\r\\n', 'g'), '\n');
}

describe('The compiled output of', () => {
  testAssets.forEach((testAsset) => {
    it(`"${testAsset}" is correct using a Babel plugin`, () => {
      const command = `npx babel ${testAsset}.ts`;
      const output = normalizeCommandOutput(execSync(command));
      const expectedOutput = normalizeCommandOutput(
        readFileSync(`${testAsset}.babel.output`, 'utf8')
      );
      expect(output).toEqual(expectedOutput);
    });
  });
});
