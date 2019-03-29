// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var bc_pb = require('./bc_pb.js');
var core_pb = require('./core_pb.js');

function serialize_bc_GetBalanceRequest(arg) {
  if (!(arg instanceof bc_pb.GetBalanceRequest)) {
    throw new Error('Expected argument of type bc.GetBalanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetBalanceRequest(buffer_arg) {
  return bc_pb.GetBalanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_GetBalanceResponse(arg) {
  if (!(arg instanceof bc_pb.GetBalanceResponse)) {
    throw new Error('Expected argument of type bc.GetBalanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetBalanceResponse(buffer_arg) {
  return bc_pb.GetBalanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_GetBlake2blRequest(arg) {
  if (!(arg instanceof bc_pb.GetBlake2blRequest)) {
    throw new Error('Expected argument of type bc.GetBlake2blRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetBlake2blRequest(buffer_arg) {
  return bc_pb.GetBlake2blRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_GetBlake2blResponse(arg) {
  if (!(arg instanceof bc_pb.GetBlake2blResponse)) {
    throw new Error('Expected argument of type bc.GetBlake2blResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetBlake2blResponse(buffer_arg) {
  return bc_pb.GetBlake2blResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_GetLatestBlocksResponse(arg) {
  if (!(arg instanceof bc_pb.GetLatestBlocksResponse)) {
    throw new Error('Expected argument of type bc.GetLatestBlocksResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetLatestBlocksResponse(buffer_arg) {
  return bc_pb.GetLatestBlocksResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_GetMatchedOpenOrdersResponse(arg) {
  if (!(arg instanceof bc_pb.GetMatchedOpenOrdersResponse)) {
    throw new Error('Expected argument of type bc.GetMatchedOpenOrdersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetMatchedOpenOrdersResponse(buffer_arg) {
  return bc_pb.GetMatchedOpenOrdersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_GetOpenOrdersResponse(arg) {
  if (!(arg instanceof bc_pb.GetOpenOrdersResponse)) {
    throw new Error('Expected argument of type bc.GetOpenOrdersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_GetOpenOrdersResponse(buffer_arg) {
  return bc_pb.GetOpenOrdersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_HelpResponse(arg) {
  if (!(arg instanceof bc_pb.HelpResponse)) {
    throw new Error('Expected argument of type bc.HelpResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_HelpResponse(buffer_arg) {
  return bc_pb.HelpResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_Null(arg) {
  if (!(arg instanceof core_pb.Null)) {
    throw new Error('Expected argument of type bc.Null');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_Null(buffer_arg) {
  return core_pb.Null.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_PlaceMakerOrderRequest(arg) {
  if (!(arg instanceof bc_pb.PlaceMakerOrderRequest)) {
    throw new Error('Expected argument of type bc.PlaceMakerOrderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_PlaceMakerOrderRequest(buffer_arg) {
  return bc_pb.PlaceMakerOrderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_PlaceTakerOrderRequest(arg) {
  if (!(arg instanceof bc_pb.PlaceTakerOrderRequest)) {
    throw new Error('Expected argument of type bc.PlaceTakerOrderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_PlaceTakerOrderRequest(buffer_arg) {
  return bc_pb.PlaceTakerOrderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_RpcTransaction(arg) {
  if (!(arg instanceof bc_pb.RpcTransaction)) {
    throw new Error('Expected argument of type bc.RpcTransaction');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_RpcTransaction(buffer_arg) {
  return bc_pb.RpcTransaction.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_RpcTransactionResponse(arg) {
  if (!(arg instanceof bc_pb.RpcTransactionResponse)) {
    throw new Error('Expected argument of type bc.RpcTransactionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_RpcTransactionResponse(buffer_arg) {
  return bc_pb.RpcTransactionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_StatsResponse(arg) {
  if (!(arg instanceof bc_pb.StatsResponse)) {
    throw new Error('Expected argument of type bc.StatsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_StatsResponse(buffer_arg) {
  return bc_pb.StatsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_VanityConvertRequest(arg) {
  if (!(arg instanceof bc_pb.VanityConvertRequest)) {
    throw new Error('Expected argument of type bc.VanityConvertRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_VanityConvertRequest(buffer_arg) {
  return bc_pb.VanityConvertRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_VanityConvertResponse(arg) {
  if (!(arg instanceof bc_pb.VanityConvertResponse)) {
    throw new Error('Expected argument of type bc.VanityConvertResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_VanityConvertResponse(buffer_arg) {
  return bc_pb.VanityConvertResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var BcService = exports.BcService = {
  getLatestBlocks: {
    path: '/bc.Bc/GetLatestBlocks',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Null,
    responseType: bc_pb.GetLatestBlocksResponse,
    requestSerialize: serialize_bc_Null,
    requestDeserialize: deserialize_bc_Null,
    responseSerialize: serialize_bc_GetLatestBlocksResponse,
    responseDeserialize: deserialize_bc_GetLatestBlocksResponse,
  },
  help: {
    path: '/bc.Bc/Help',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Null,
    responseType: bc_pb.HelpResponse,
    requestSerialize: serialize_bc_Null,
    requestDeserialize: deserialize_bc_Null,
    responseSerialize: serialize_bc_HelpResponse,
    responseDeserialize: deserialize_bc_HelpResponse,
  },
  stats: {
    path: '/bc.Bc/Stats',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Null,
    responseType: bc_pb.StatsResponse,
    requestSerialize: serialize_bc_Null,
    requestDeserialize: deserialize_bc_Null,
    responseSerialize: serialize_bc_StatsResponse,
    responseDeserialize: deserialize_bc_StatsResponse,
  },
  newTx: {
    path: '/bc.Bc/NewTx',
    requestStream: false,
    responseStream: false,
    requestType: bc_pb.RpcTransaction,
    responseType: bc_pb.RpcTransactionResponse,
    requestSerialize: serialize_bc_RpcTransaction,
    requestDeserialize: deserialize_bc_RpcTransaction,
    responseSerialize: serialize_bc_RpcTransactionResponse,
    responseDeserialize: deserialize_bc_RpcTransactionResponse,
  },
  getBalance: {
    path: '/bc.Bc/GetBalance',
    requestStream: false,
    responseStream: false,
    requestType: bc_pb.GetBalanceRequest,
    responseType: bc_pb.GetBalanceResponse,
    requestSerialize: serialize_bc_GetBalanceRequest,
    requestDeserialize: deserialize_bc_GetBalanceRequest,
    responseSerialize: serialize_bc_GetBalanceResponse,
    responseDeserialize: deserialize_bc_GetBalanceResponse,
  },
  placeMakerOrder: {
    path: '/bc.Bc/PlaceMakerOrder',
    requestStream: false,
    responseStream: false,
    requestType: bc_pb.PlaceMakerOrderRequest,
    responseType: bc_pb.RpcTransactionResponse,
    requestSerialize: serialize_bc_PlaceMakerOrderRequest,
    requestDeserialize: deserialize_bc_PlaceMakerOrderRequest,
    responseSerialize: serialize_bc_RpcTransactionResponse,
    responseDeserialize: deserialize_bc_RpcTransactionResponse,
  },
  placeTakerOrder: {
    path: '/bc.Bc/PlaceTakerOrder',
    requestStream: false,
    responseStream: false,
    requestType: bc_pb.PlaceTakerOrderRequest,
    responseType: bc_pb.RpcTransactionResponse,
    requestSerialize: serialize_bc_PlaceTakerOrderRequest,
    requestDeserialize: deserialize_bc_PlaceTakerOrderRequest,
    responseSerialize: serialize_bc_RpcTransactionResponse,
    responseDeserialize: deserialize_bc_RpcTransactionResponse,
  },
  getOpenOrders: {
    path: '/bc.Bc/GetOpenOrders',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Null,
    responseType: bc_pb.GetOpenOrdersResponse,
    requestSerialize: serialize_bc_Null,
    requestDeserialize: deserialize_bc_Null,
    responseSerialize: serialize_bc_GetOpenOrdersResponse,
    responseDeserialize: deserialize_bc_GetOpenOrdersResponse,
  },
  getMatchedOpenOrders: {
    path: '/bc.Bc/GetMatchedOpenOrders',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Null,
    responseType: bc_pb.GetMatchedOpenOrdersResponse,
    requestSerialize: serialize_bc_Null,
    requestDeserialize: deserialize_bc_Null,
    responseSerialize: serialize_bc_GetMatchedOpenOrdersResponse,
    responseDeserialize: deserialize_bc_GetMatchedOpenOrdersResponse,
  },
  getBlake2bl: {
    path: '/bc.Bc/GetBlake2bl',
    requestStream: false,
    responseStream: false,
    requestType: bc_pb.GetBlake2blRequest,
    responseType: bc_pb.GetBlake2blResponse,
    requestSerialize: serialize_bc_GetBlake2blRequest,
    requestDeserialize: deserialize_bc_GetBlake2blRequest,
    responseSerialize: serialize_bc_GetBlake2blResponse,
    responseDeserialize: deserialize_bc_GetBlake2blResponse,
  },
  getBcAddressViaVanity: {
    path: '/bc.Bc/GetBcAddressViaVanity',
    requestStream: false,
    responseStream: false,
    requestType: bc_pb.VanityConvertRequest,
    responseType: bc_pb.VanityConvertResponse,
    requestSerialize: serialize_bc_VanityConvertRequest,
    requestDeserialize: deserialize_bc_VanityConvertRequest,
    responseSerialize: serialize_bc_VanityConvertResponse,
    responseDeserialize: deserialize_bc_VanityConvertResponse,
  },
};

exports.BcClient = grpc.makeGenericClientConstructor(BcService);
