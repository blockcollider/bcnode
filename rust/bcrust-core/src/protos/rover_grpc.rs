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
    fn join(&self, o: ::grpc::RequestOptions, p: super::rover::RoverIdent) -> ::grpc::StreamingResponse<super::rover::RoverMessage>;

    fn collect_block(&self, o: ::grpc::RequestOptions, p: super::core::Block) -> ::grpc::SingleResponse<super::core::Null>;

    fn report_sync_status(&self, o: ::grpc::RequestOptions, p: super::rover::RoverSyncStatus) -> ::grpc::SingleResponse<super::core::Null>;

    fn is_before_settle_height(&self, o: ::grpc::RequestOptions, p: super::rover::SettleTxCheckReq) -> ::grpc::SingleResponse<super::rover::SettleTxCheckResponse>;
}

// client

pub struct RoverClient {
    grpc_client: ::grpc::Client,
    method_Join: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::rover::RoverIdent, super::rover::RoverMessage>>,
    method_CollectBlock: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Block, super::core::Null>>,
    method_ReportSyncStatus: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::rover::RoverSyncStatus, super::core::Null>>,
    method_IsBeforeSettleHeight: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::rover::SettleTxCheckReq, super::rover::SettleTxCheckResponse>>,
}

impl RoverClient {
    pub fn with_client(grpc_client: ::grpc::Client) -> Self {
        RoverClient {
            grpc_client: grpc_client,
            method_Join: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Rover/Join".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::ServerStreaming,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_CollectBlock: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Rover/CollectBlock".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_ReportSyncStatus: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Rover/ReportSyncStatus".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_IsBeforeSettleHeight: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Rover/IsBeforeSettleHeight".to_string(),
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
    fn join(&self, o: ::grpc::RequestOptions, p: super::rover::RoverIdent) -> ::grpc::StreamingResponse<super::rover::RoverMessage> {
        self.grpc_client.call_server_streaming(o, p, self.method_Join.clone())
    }

    fn collect_block(&self, o: ::grpc::RequestOptions, p: super::core::Block) -> ::grpc::SingleResponse<super::core::Null> {
        self.grpc_client.call_unary(o, p, self.method_CollectBlock.clone())
    }

    fn report_sync_status(&self, o: ::grpc::RequestOptions, p: super::rover::RoverSyncStatus) -> ::grpc::SingleResponse<super::core::Null> {
        self.grpc_client.call_unary(o, p, self.method_ReportSyncStatus.clone())
    }

    fn is_before_settle_height(&self, o: ::grpc::RequestOptions, p: super::rover::SettleTxCheckReq) -> ::grpc::SingleResponse<super::rover::SettleTxCheckResponse> {
        self.grpc_client.call_unary(o, p, self.method_IsBeforeSettleHeight.clone())
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
                        name: "/bc.Rover/Join".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::ServerStreaming,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerServerStreaming::new(move |o, p| handler_copy.join(o, p))
                    },
                ),
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
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Rover/ReportSyncStatus".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.report_sync_status(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Rover/IsBeforeSettleHeight".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.is_before_settle_height(o, p))
                    },
                ),
            ],
        )
    }
}
