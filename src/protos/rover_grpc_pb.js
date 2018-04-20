// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var core_pb = require('./core_pb.js');

function serialize_bc_Block(arg) {
  if (!(arg instanceof core_pb.Block)) {
    throw new Error('Expected argument of type bc.Block');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_Block(buffer_arg) {
  return core_pb.Block.deserializeBinary(new Uint8Array(buffer_arg));
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


var RoverService = exports.RoverService = {
  // Sends a greeting
  collectBlock: {
    path: '/bc.Rover/CollectBlock',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.Block,
    responseType: core_pb.Null,
    requestSerialize: serialize_bc_Block,
    requestDeserialize: deserialize_bc_Block,
    responseSerialize: serialize_bc_Null,
    responseDeserialize: deserialize_bc_Null,
  },
};

exports.RoverClient = grpc.makeGenericClientConstructor(RoverService);
