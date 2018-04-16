extern crate protoc_rust_grpc;

fn main() {
    protoc_rust_grpc::run(protoc_rust_grpc::Args {
        out_dir: "src/protos",
        input: &[
            "../../protos/bc.proto",
            "../../protos/core.proto",
            "../../protos/db.proto",
            "../../protos/miner.proto",
            "../../protos/protocol.proto",
            "../../protos/rover.proto",
        ],
        includes: &["../../protos"],
        rust_protobuf: true, // also generate protobuf messages, not just services
    }).expect("protoc-rust-grpc");
}
