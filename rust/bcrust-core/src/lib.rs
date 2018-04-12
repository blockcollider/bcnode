#![feature(rustc_private)]

#![feature(test)]
extern crate test;
extern crate serialize;
extern crate blake2_rfc;

extern crate crypto;
#[macro_use]
extern crate log;
extern crate num_cpus;
extern crate rand;
extern crate strsim;

pub mod data;
pub mod funcs;
pub mod miner;
pub mod miner_new;
