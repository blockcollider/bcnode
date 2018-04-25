#! /usr/bin/env node

const { Benchmark } = require('./benchmark')

export const main = () => {
  // Run main entry-point
  const app = new Benchmark()
  app.run()
}

if (require.main === module) {
  main(process.argv)
}
