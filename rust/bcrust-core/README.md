# bcrust-core

Library natively implementing core BC functionality

## Prerequisites

- [cargo-clippy](https://github.com/rust-lang-nursery/rust-clippy)
- [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz)
- [afl.rs](https://github.com/rust-fuzz/afl.rs)

## Features

## QA

- Best practices
- Tests
- Benchmarks
- Fuzzers

### Best practices

```
$ cargo clippy
```

### Tests

```
$ cargo test --all
```

### Benchmarks

```
$ cargo test --benches
```

### Fuzzers

**afl.rs**

```
$ cargo afl build
$ cargo afl fuzz -i in -o out target/debug/bcrust_core
```

**cargo-fuzz**

```
$ cargo fuzz run fuzz_target_miner
```
