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

pub trait Bc {
    fn get_latest_blocks(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::GetLatestBlocksResponse>;

    fn help(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::HelpResponse>;

    fn stats(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::StatsResponse>;
}

// client

pub struct BcClient {
    grpc_client: ::grpc::Client,
    method_GetLatestBlocks: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::GetLatestBlocksResponse>>,
    method_Help: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::HelpResponse>>,
    method_Stats: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::StatsResponse>>,
}

impl BcClient {
    pub fn with_client(grpc_client: ::grpc::Client) -> Self {
        BcClient {
            grpc_client: grpc_client,
            method_GetLatestBlocks: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/GetLatestBlocks".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_Help: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/Help".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_Stats: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/Stats".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
        }
    }

    pub fn new_plain(host: &str, port: u16, conf: ::grpc::ClientConf) -> ::grpc::Result<Self> {
        ::grpc::Client::new_plain(host, port, conf).map(|c| {
            BcClient::with_client(c)
        })
    }
    pub fn new_tls<C : ::tls_api::TlsConnector>(host: &str, port: u16, conf: ::grpc::ClientConf) -> ::grpc::Result<Self> {
        ::grpc::Client::new_tls::<C>(host, port, conf).map(|c| {
            BcClient::with_client(c)
        })
    }
}

impl Bc for BcClient {
    fn get_latest_blocks(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::GetLatestBlocksResponse> {
        self.grpc_client.call_unary(o, p, self.method_GetLatestBlocks.clone())
    }

    fn help(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::HelpResponse> {
        self.grpc_client.call_unary(o, p, self.method_Help.clone())
    }

    fn stats(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::StatsResponse> {
        self.grpc_client.call_unary(o, p, self.method_Stats.clone())
    }
}

// server

pub struct BcServer;


impl BcServer {
    pub fn new_service_def<H : Bc + 'static + Sync + Send + 'static>(handler: H) -> ::grpc::rt::ServerServiceDefinition {
        let handler_arc = ::std::sync::Arc::new(handler);
        ::grpc::rt::ServerServiceDefinition::new("/bc.Bc",
            vec![
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/GetLatestBlocks".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.get_latest_blocks(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/Help".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.help(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/Stats".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.stats(o, p))
                    },
                ),
            ],
        )
    }
}
