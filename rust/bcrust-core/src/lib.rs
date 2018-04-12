#![feature(rustc_private)]

#![feature(test)]
extern crate test;
extern crate serialize;
extern crate blake2_rfc;
extern crate grpc;
extern crate tls_api;

extern crate crypto;
#[macro_use]
extern crate log;
extern crate num_cpus;
extern crate protobuf;
extern crate rand;
extern crate strsim;

pub mod data;
pub mod funcs;
pub mod miner;
pub mod protos;

