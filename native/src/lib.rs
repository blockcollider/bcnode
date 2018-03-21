extern crate crypto;
#[macro_use]
extern crate neon;
extern crate grpc;

#[macro_use]
extern crate log;

extern crate num_cpus;
extern crate protobuf;
extern crate rand;
extern crate strsim;
extern crate tls_api;

use neon::vm::{Call, JsResult, Lock};
use neon::js::JsString;
use neon::js::binary::JsBuffer;
use neon::mem::Handle;

use protobuf::core::parse_from_bytes;
use protobuf::Message;

pub mod miner;
pub mod protos;

use protos::core::Block;

fn hello(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    Ok(JsString::new(scope, "Hello from native world!").unwrap())
}

fn mine(call: Call) -> JsResult<JsBuffer> {
    debug!("mine()");

    // Deserialize input
    let mut buffer: Handle<JsBuffer> = call.arguments.require(call.scope, 0)?.check::<JsBuffer>()?;
    let in_block = buffer.grab(|mut contents| {
        let slice = contents.as_slice();
        parse_from_bytes::<Block>(&slice)
    });

    // Construct result block
    let mut block = Block::new();
    block.set_hash(String::from("123456"));
    block.set_blockchain(in_block.unwrap().get_blockchain().to_string());

    // Serialize output
    let serialized = block.write_to_bytes().unwrap();
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
    m.export("mine", mine)?;

    Ok(())
});
