#[macro_use]
extern crate neon;
extern crate grpc;
extern crate protobuf;
extern crate tls_api;

use neon::vm::{Call, JsResult, Lock};
use neon::js::JsString;
use neon::js::binary::JsBuffer;
use neon::mem::Handle;

use protobuf::Message;

pub mod protos;

fn hello(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    Ok(JsString::new(scope, "Hello from native world!").unwrap())
}

fn mine(call: Call) -> JsResult<JsBuffer> {
    println!("mine()");

    // Deserialize input
    let mut buffer: Handle<JsBuffer> = call.arguments.require(call.scope, 0)?.check::<JsBuffer>()?;
    buffer.grab(|mut contents| {
        let slice = contents.as_slice();
        println!("{:?}", &slice);
    });

    let mut block = protos::core::Block::new();
    block.set_hash(String::from("123456"));
    block.set_blockchain(String::from("bc"));

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
