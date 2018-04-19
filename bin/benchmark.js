#! /usr/bin/env node

const Benchmark = require('../lib/benchmark').Benchmark

// Run main entry-point
const app = new Benchmark()
app.run()
