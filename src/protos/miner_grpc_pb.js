// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var miner_pb = require('./miner_pb.js');
var core_pb = require('./core_pb.js');

function serialize_bc_MinerRequest(arg) {
  if (!(arg instanceof miner_pb.MinerRequest)) {
    throw new Error('Expected argument of type bc.MinerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_MinerRequest(buffer_arg) {
  return miner_pb.MinerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_MinerResponse(arg) {
  if (!(arg instanceof miner_pb.MinerResponse)) {
    throw new Error('Expected argument of type bc.MinerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bc_MinerResponse(buffer_arg) {
  return miner_pb.MinerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var MinerService = exports.MinerService = {
  mine: {
    path: '/bc.Miner/Mine',
    requestStream: false,
    responseStream: false,
    requestType: miner_pb.MinerRequest,
    responseType: miner_pb.MinerResponse,
    requestSerialize: serialize_bc_MinerRequest,
    requestDeserialize: deserialize_bc_MinerRequest,
    responseSerialize: serialize_bc_MinerResponse,
    responseDeserialize: deserialize_bc_MinerResponse,
  },
};

exports.MinerClient = grpc.makeGenericClientConstructor(MinerService);
