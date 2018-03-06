// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var bc_pb = require('./bc_pb.js');
var core_pb = require('./core_pb.js');

function serialize_bc_Null(arg) {
  if (!(arg instanceof core_pb.Null)) {
    throw new Error('Expected argument of type bc.Null');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_Null(buffer_arg) {
  return core_pb.Null.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_Stats(arg) {
  if (!(arg instanceof bc_pb.Stats)) {
    throw new Error('Expected argument of type bc.Stats');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_Stats(buffer_arg) {
  return bc_pb.Stats.deserializeBinary(new Uint8Array(buffer_arg));
}


var BcService = exports.BcService = {
  statistic: {
    path: '/bc.Bc/statistic',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Null,
    responseType: bc_pb.Stats,
    requestSerialize: serialize_bc_Null,
    requestDeserialize: deserialize_bc_Null,
    responseSerialize: serialize_bc_Stats,
    responseDeserialize: deserialize_bc_Stats,
  },
};

exports.BcClient = grpc.makeGenericClientConstructor(BcService);
