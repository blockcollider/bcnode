#![cfg_attr(test, feature(plugin))]
#![cfg_attr(test, plugin(clippy))]

extern crate bcrust_core;

#[macro_use]
extern crate neon;
extern crate grpc;

#[macro_use]
extern crate log;

extern crate env_logger;
extern crate protobuf;
extern crate tls_api;

use bcrust_core::miner_new;
use bcrust_core::protos::miner::*;

use neon::vm::{Call, JsResult, Lock};
use neon::js::JsBoolean;
use neon::js::JsString;
use neon::js::binary::JsBuffer;
use neon::mem::Handle;

use protobuf::core::parse_from_bytes;
use protobuf::Message;

fn init_logger(call: Call) -> JsResult<JsBoolean> {
    let scope = call.scope;
    let res = match env_logger::init() {
        Ok(_) => true,
        _ => false
    };

    Ok(JsBoolean::new(scope, res))
}

fn hello(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    Ok(JsString::new(scope, "Hello from native world!").unwrap())
}

fn mine(call: Call) -> JsResult<JsBuffer> {
    debug!("mine()");

    // Deserialize input
    let mut buffer: Handle<JsBuffer> = call.arguments.require(call.scope, 0)?.check::<JsBuffer>()?;
    let in_block = buffer.grab(|contents| {
        let slice = contents.as_slice();
        parse_from_bytes::<MinerRequest>(&slice)
    }).unwrap();

    let out_block: MinerResponse = miner_new::mine(&in_block);
    debug!("{:?}", &out_block);

    // Serialize output
    let serialized = out_block.write_to_bytes().unwrap();
    let scope = call.scope;
    let mut buffer = try!(JsBuffer::new(scope, serialized.len() as u32));
    buffer.grab(|mut contents| {
        let slice = contents.as_mut_slice();
        for i in 0..slice.len() {
            slice[i] = serialized[i] as u8;
        }
    });

    Ok(buffer)
}

register_module!(m, {
    m.export("hello", hello)?;
    m.export("initLogger", init_logger)?;
    m.export("mine", mine)?;

    Ok(())
});

