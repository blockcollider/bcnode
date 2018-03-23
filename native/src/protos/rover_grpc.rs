// This file is generated. Do not edit
// @generated

// https://github.com/Manishearth/rust-clippy/issues/702
#![allow(unknown_lints)]
#![allow(clippy)]

#![cfg_attr(rustfmt, rustfmt_skip)]

#![allow(box_pointers)]
#![allow(dead_code)]
#![allow(missing_docs)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(non_upper_case_globals)]
#![allow(trivial_casts)]
#![allow(unsafe_code)]
#![allow(unused_imports)]
#![allow(unused_results)]


// interface

pub trait Rover {
    fn collect_block(&self, o: ::grpc::RequestOptions, p: super::core::Block) -> ::grpc::SingleResponse<super::core::Null>;
}

// client

pub struct RoverClient {
    grpc_client: ::grpc::Client,
    method_CollectBlock: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Block, super::core::Null>>,
}

impl RoverClient {
    pub fn with_client(grpc_client: ::grpc::Client) -> Self {
        RoverClient {
            grpc_client: grpc_client,
            method_CollectBlock: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Rover/CollectBlock".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
        }
    }

    pub fn new_plain(host: &str, port: u16, conf: ::grpc::ClientConf) -> ::grpc::Result<Self> {
        ::grpc::Client::new_plain(host, port, conf).map(|c| {
            RoverClient::with_client(c)
        })
    }
    pub fn new_tls<C : ::tls_api::TlsConnector>(host: &str, port: u16, conf: ::grpc::ClientConf) -> ::grpc::Result<Self> {
        ::grpc::Client::new_tls::<C>(host, port, conf).map(|c| {
            RoverClient::with_client(c)
        })
    }
}

impl Rover for RoverClient {
    fn collect_block(&self, o: ::grpc::RequestOptions, p: super::core::Block) -> ::grpc::SingleResponse<super::core::Null> {
        self.grpc_client.call_unary(o, p, self.method_CollectBlock.clone())
    }
}

// server

pub struct RoverServer;


impl RoverServer {
    pub fn new_service_def<H : Rover + 'static + Sync + Send + 'static>(handler: H) -> ::grpc::rt::ServerServiceDefinition {
        let handler_arc = ::std::sync::Arc::new(handler);
        ::grpc::rt::ServerServiceDefinition::new("/bc.Rover",
            vec![
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Rover/CollectBlock".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.collect_block(o, p))
                    },
                ),
            ],
        )
    }
}
