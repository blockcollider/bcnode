#![no_main]
#[macro_use]
extern crate libfuzzer_sys;
extern crate bcrust_core;

use bcrust_core::miner;

//pub fn pop_vec(input: &mut Vec<String>) {
//    input.pop().unwrap();
//}
//
//fuzz_target!(|input: Vec<String>| {
//    let mut tmp = input.clone();
//    pop_vec(&mut tmp)
//});


fuzz_target!(|input: (Vec<String>, f32)| {
    miner::mine(&input.0, input.1).unwrap();
});
