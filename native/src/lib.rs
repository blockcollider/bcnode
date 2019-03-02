extern crate bcrust_core;

#[macro_use]
extern crate neon;

#[macro_use]
extern crate log;

extern crate env_logger;

use bcrust_core::funcs;

use neon::prelude::*;

fn hello(mut cx: FunctionContext) -> JsResult<JsString> {
    Ok(cx.string("Hello from native world!"))
}

fn init_logger(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let _ = env_logger::init();

    Ok(cx.boolean(true))
}

// TODO: Needs to be ported neon@0.1 -> neon@0.2
//fn mine(mut cx: FunctionContext) -> JsResult<JsBuffer> {
//    // Deserialize input
//    let mut buffer: Handle<JsBuffer> = cx.argument(0)?;
//    let in_block = buffer.grab(|contents| {
//        let slice = contents.as_slice();
//        parse_from_bytes::<MinerRequest>(&slice)
//    }).unwrap();
//
//    let out_block: MinerResponse = miner::mine(&in_block);
//
//    // Serialize output
//    let serialized = out_block.write_to_bytes().unwrap();
//    let mut buffer = try!(JsBuffer::new(&mut cx, serialized.len() as u32));
//    buffer.grab(|mut contents| {
//        let slice = contents.as_mut_slice();
//        for i in 0..slice.len() {
//            slice[i] = serialized[i] as u8;
//        }
//    });
//
//    Ok(buffer)
//}


fn float_divide(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let arg0: Handle<JsNumber> = cx.argument(0)?;
    let arg1: Handle<JsNumber> = cx.argument(1)?;

    let a: f64 = arg0.value();
    let b: f64 = arg1.value();

    Ok(cx.number(a / b))
}

fn float_multiply(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let arg0: Handle<JsNumber> = cx.argument(0)?;
    let arg1: Handle<JsNumber> = cx.argument(1)?;

    let a: f64 = arg0.value();
    let b: f64 = arg1.value();

    Ok(cx.number(a * b))
}

fn l2norm(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let arg0: Handle<JsArray> = cx.argument(0)?;

    let a: Vec<f64> = arg0.to_vec(&mut cx)?.into_iter().map(|item| {
        item.downcast::<JsNumber>().unwrap().value()
    }).collect();

    debug!("a = {:?}", &a);

    Ok(cx.number(funcs::l2norm(&a)))
}

fn cosine_similarity(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let arg0: Handle<JsArray> = cx.argument(0)?;
    let arg1: Handle<JsArray> = cx.argument(1)?;

    let x: Vec<f64> = arg0.to_vec(&mut cx)?.into_iter().map(|item| {
        item.downcast::<JsNumber>().unwrap().value()
    }).collect();

    let y: Vec<f64> = arg1.to_vec(&mut cx)?.into_iter().map(|item| {
        item.downcast::<JsNumber>().unwrap().value()
    }).collect();

    debug!("x = {:?}", &x);
    debug!("y = {:?}", &y);

    Ok(cx.number(funcs::cosine_similarity(&x, &y)))
}

fn cosine_distance(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let arg0: Handle<JsArray> = cx.argument(0)?;
    let arg1: Handle<JsArray> = cx.argument(1)?;

    let x: Vec<f64> = arg0.to_vec(&mut cx)?.into_iter().map(|item| {
        item.downcast::<JsNumber>().unwrap().value()
    }).collect();

    let y: Vec<f64> = arg1.to_vec(&mut cx)?.into_iter().map(|item| {
        item.downcast::<JsNumber>().unwrap().value()
    }).collect();

    debug!("x = {:?}", &x);
    debug!("y = {:?}", &y);

    Ok(cx.number(funcs::cosine_distance(&x, &y)))
}

fn distance(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let arg0: Handle<JsString> = cx.argument(0)?;
    let arg1: Handle<JsString> = cx.argument(1)?;

    let a: String = arg0.value();
    let b: String = arg1.value();

    let res = funcs::distance(&a.as_bytes(), &b.as_bytes());

    Ok(cx.number(res as f64))
}

register_module!(mut m, {
    m.export_function("hello", hello)?;
    m.export_function("initLogger", init_logger)?;

    // Math functions
    m.export_function("float_divide", float_divide)?;
    m.export_function("float_multiply", float_multiply)?;

    // Similarity functions
    m.export_function("l2norm", l2norm)?;
    m.export_function("cosine_similarity", cosine_similarity)?;
    m.export_function("cosine_distance", cosine_distance)?;

    // Miner functions
    m.export_function("distance", distance)?;

    Ok(())
});

