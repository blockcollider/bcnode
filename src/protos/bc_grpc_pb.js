// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var bc_pb = require('./bc_pb.js');
var core_pb = require('./core_pb.js');

function serialize_bc_GetLatestBlocksResponse(arg) {
  if (!(arg instanceof bc_pb.GetLatestBlocksResponse)) {
    throw new Error('Expected argument of type bc.GetLatestBlocksResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_GetLatestBlocksResponse(buffer_arg) {
  return bc_pb.GetLatestBlocksResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_HelpResponse(arg) {
  if (!(arg instanceof bc_pb.HelpResponse)) {
    throw new Error('Expected argument of type bc.HelpResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_HelpResponse(buffer_arg) {
  return bc_pb.HelpResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_Null(arg) {
  if (!(arg instanceof core_pb.Null)) {
    throw new Error('Expected argument of type bc.Null');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_Null(buffer_arg) {
  return core_pb.Null.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_StatsResponse(arg) {
  if (!(arg instanceof bc_pb.StatsResponse)) {
    throw new Error('Expected argument of type bc.StatsResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_StatsResponse(buffer_arg) {
  return bc_pb.StatsResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
};

exports.BcClient = grpc.makeGenericClientConstructor(BcService);
