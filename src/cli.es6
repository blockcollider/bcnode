// @flow

import program from 'commander';

const pkg = require('../package.json');

// export function concat(a: string, b: string): string {
//   return a + b;
// }

// eslint-disable-next-line import/prefer-default-export
export function main() {
  // concat(1, 2);

  program
    .version(pkg.version)
    // .option('-h, --help', 'Show help')
    .parse(process.argv);
}
