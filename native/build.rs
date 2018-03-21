extern crate neon_build;
extern crate protoc_rust_grpc;

fn main() {
    neon_build::setup(); // must be called in build.rs

    // add project-specific build logic here...
//    protoc_rust::run(protoc_rust::Args {
//        out_dir: "src/protos",
//        input: &[
//            "../protos/bc.proto",
//            "../protos/core.proto",
//            "../protos/db.proto",
//            "../protos/rover.proto",
//        ],
//        includes: &["../protos"],
//    }).expect("protoc");

    protoc_rust_grpc::run(protoc_rust_grpc::Args {
        out_dir: "src/protos",
        input: &[
            "../protos/bc.proto",
            "../protos/core.proto",
            "../protos/db.proto",
            "../protos/miner.proto",
            "../protos/rover.proto",
        ],
        includes: &["../protos"],
        rust_protobuf: true, // also generate protobuf messages, not just services
    }).expect("protoc-rust-grpc");
}
