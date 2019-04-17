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

    fn new_tx(&self, o: ::grpc::RequestOptions, p: super::bc::RpcTransaction) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse>;

    fn get_balance(&self, o: ::grpc::RequestOptions, p: super::bc::GetBalanceRequest) -> ::grpc::SingleResponse<super::bc::GetBalanceResponse>;

    fn place_maker_order(&self, o: ::grpc::RequestOptions, p: super::bc::PlaceMakerOrderRequest) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse>;

    fn place_taker_order(&self, o: ::grpc::RequestOptions, p: super::bc::PlaceTakerOrderRequest) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse>;

    fn place_taker_orders(&self, o: ::grpc::RequestOptions, p: super::bc::PlaceTakerOrdersRequest) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse>;

    fn calculate_maker_fee(&self, o: ::grpc::RequestOptions, p: super::bc::CalculateMakerFeeRequest) -> ::grpc::SingleResponse<super::bc::FeeResponse>;

    fn calculate_taker_fee(&self, o: ::grpc::RequestOptions, p: super::bc::CalculateTakerFeeRequest) -> ::grpc::SingleResponse<super::bc::FeeResponse>;

    fn get_open_orders(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::GetOpenOrdersResponse>;

    fn get_matched_orders(&self, o: ::grpc::RequestOptions, p: super::bc::GetMatchedOrdersRequest) -> ::grpc::SingleResponse<super::bc::GetMatchedOrdersResponse>;

    fn get_blake2bl(&self, o: ::grpc::RequestOptions, p: super::bc::GetBlake2blRequest) -> ::grpc::SingleResponse<super::bc::GetBlake2blResponse>;

    fn get_bc_address_via_vanity(&self, o: ::grpc::RequestOptions, p: super::bc::VanityConvertRequest) -> ::grpc::SingleResponse<super::bc::VanityConvertResponse>;
}

// client

pub struct BcClient {
    grpc_client: ::grpc::Client,
    method_GetLatestBlocks: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::GetLatestBlocksResponse>>,
    method_Help: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::HelpResponse>>,
    method_Stats: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::StatsResponse>>,
    method_NewTx: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::RpcTransaction, super::bc::RpcTransactionResponse>>,
    method_GetBalance: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::GetBalanceRequest, super::bc::GetBalanceResponse>>,
    method_PlaceMakerOrder: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::PlaceMakerOrderRequest, super::bc::RpcTransactionResponse>>,
    method_PlaceTakerOrder: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::PlaceTakerOrderRequest, super::bc::RpcTransactionResponse>>,
    method_PlaceTakerOrders: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::PlaceTakerOrdersRequest, super::bc::RpcTransactionResponse>>,
    method_CalculateMakerFee: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::CalculateMakerFeeRequest, super::bc::FeeResponse>>,
    method_CalculateTakerFee: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::CalculateTakerFeeRequest, super::bc::FeeResponse>>,
    method_GetOpenOrders: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::core::Null, super::bc::GetOpenOrdersResponse>>,
    method_GetMatchedOrders: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::GetMatchedOrdersRequest, super::bc::GetMatchedOrdersResponse>>,
    method_GetBlake2bl: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::GetBlake2blRequest, super::bc::GetBlake2blResponse>>,
    method_GetBcAddressViaVanity: ::std::sync::Arc<::grpc::rt::MethodDescriptor<super::bc::VanityConvertRequest, super::bc::VanityConvertResponse>>,
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
            method_NewTx: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/NewTx".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_GetBalance: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/GetBalance".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_PlaceMakerOrder: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/PlaceMakerOrder".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_PlaceTakerOrder: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/PlaceTakerOrder".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_PlaceTakerOrders: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/PlaceTakerOrders".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_CalculateMakerFee: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/CalculateMakerFee".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_CalculateTakerFee: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/CalculateTakerFee".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_GetOpenOrders: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/GetOpenOrders".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_GetMatchedOrders: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/GetMatchedOrders".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_GetBlake2bl: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/GetBlake2bl".to_string(),
                streaming: ::grpc::rt::GrpcStreaming::Unary,
                req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
            }),
            method_GetBcAddressViaVanity: ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                name: "/bc.Bc/GetBcAddressViaVanity".to_string(),
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

    fn new_tx(&self, o: ::grpc::RequestOptions, p: super::bc::RpcTransaction) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse> {
        self.grpc_client.call_unary(o, p, self.method_NewTx.clone())
    }

    fn get_balance(&self, o: ::grpc::RequestOptions, p: super::bc::GetBalanceRequest) -> ::grpc::SingleResponse<super::bc::GetBalanceResponse> {
        self.grpc_client.call_unary(o, p, self.method_GetBalance.clone())
    }

    fn place_maker_order(&self, o: ::grpc::RequestOptions, p: super::bc::PlaceMakerOrderRequest) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse> {
        self.grpc_client.call_unary(o, p, self.method_PlaceMakerOrder.clone())
    }

    fn place_taker_order(&self, o: ::grpc::RequestOptions, p: super::bc::PlaceTakerOrderRequest) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse> {
        self.grpc_client.call_unary(o, p, self.method_PlaceTakerOrder.clone())
    }

    fn place_taker_orders(&self, o: ::grpc::RequestOptions, p: super::bc::PlaceTakerOrdersRequest) -> ::grpc::SingleResponse<super::bc::RpcTransactionResponse> {
        self.grpc_client.call_unary(o, p, self.method_PlaceTakerOrders.clone())
    }

    fn calculate_maker_fee(&self, o: ::grpc::RequestOptions, p: super::bc::CalculateMakerFeeRequest) -> ::grpc::SingleResponse<super::bc::FeeResponse> {
        self.grpc_client.call_unary(o, p, self.method_CalculateMakerFee.clone())
    }

    fn calculate_taker_fee(&self, o: ::grpc::RequestOptions, p: super::bc::CalculateTakerFeeRequest) -> ::grpc::SingleResponse<super::bc::FeeResponse> {
        self.grpc_client.call_unary(o, p, self.method_CalculateTakerFee.clone())
    }

    fn get_open_orders(&self, o: ::grpc::RequestOptions, p: super::core::Null) -> ::grpc::SingleResponse<super::bc::GetOpenOrdersResponse> {
        self.grpc_client.call_unary(o, p, self.method_GetOpenOrders.clone())
    }

    fn get_matched_orders(&self, o: ::grpc::RequestOptions, p: super::bc::GetMatchedOrdersRequest) -> ::grpc::SingleResponse<super::bc::GetMatchedOrdersResponse> {
        self.grpc_client.call_unary(o, p, self.method_GetMatchedOrders.clone())
    }

    fn get_blake2bl(&self, o: ::grpc::RequestOptions, p: super::bc::GetBlake2blRequest) -> ::grpc::SingleResponse<super::bc::GetBlake2blResponse> {
        self.grpc_client.call_unary(o, p, self.method_GetBlake2bl.clone())
    }

    fn get_bc_address_via_vanity(&self, o: ::grpc::RequestOptions, p: super::bc::VanityConvertRequest) -> ::grpc::SingleResponse<super::bc::VanityConvertResponse> {
        self.grpc_client.call_unary(o, p, self.method_GetBcAddressViaVanity.clone())
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
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/NewTx".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.new_tx(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/GetBalance".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.get_balance(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/PlaceMakerOrder".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.place_maker_order(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/PlaceTakerOrder".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.place_taker_order(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/PlaceTakerOrders".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.place_taker_orders(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/CalculateMakerFee".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.calculate_maker_fee(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/CalculateTakerFee".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.calculate_taker_fee(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/GetOpenOrders".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.get_open_orders(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/GetMatchedOrders".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.get_matched_orders(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/GetBlake2bl".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.get_blake2bl(o, p))
                    },
                ),
                ::grpc::rt::ServerMethod::new(
                    ::std::sync::Arc::new(::grpc::rt::MethodDescriptor {
                        name: "/bc.Bc/GetBcAddressViaVanity".to_string(),
                        streaming: ::grpc::rt::GrpcStreaming::Unary,
                        req_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                        resp_marshaller: Box::new(::grpc::protobuf::MarshallerProtobuf),
                    }),
                    {
                        let handler_copy = handler_arc.clone();
                        ::grpc::rt::MethodHandlerUnary::new(move |o, p| handler_copy.get_bc_address_via_vanity(o, p))
                    },
                ),
            ],
        )
    }
}
