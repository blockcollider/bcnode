// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var block_pb = require('./block_pb.js');

function serialize_bc_Block(arg) {
  if (!(arg instanceof block_pb.Block)) {
    throw new Error('Expected argument of type bc.Block');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_Block(buffer_arg) {
  return block_pb.Block.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bc_BlockReply(arg) {
  if (!(arg instanceof block_pb.BlockReply)) {
    throw new Error('Expected argument of type bc.BlockReply');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_bc_BlockReply(buffer_arg) {
  return block_pb.BlockReply.deserializeBinary(new Uint8Array(buffer_arg));
}


var CollectorService = exports.CollectorService = {
  // Sends a greeting
  collectBlock: {
    path: '/bc.Collector/CollectBlock',
    requestStream: false,
    responseStream: false,
    requestType: block_pb.Block,
    responseType: block_pb.BlockReply,
    requestSerialize: serialize_bc_Block,
    requestDeserialize: deserialize_bc_Block,
    responseSerialize: serialize_bc_BlockReply,
    responseDeserialize: deserialize_bc_BlockReply,
  },
};

exports.CollectorClient = grpc.makeGenericClientConstructor(CollectorService);
