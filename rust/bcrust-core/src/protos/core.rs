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

use protobuf::Message as Message_imported_for_functions;
use protobuf::ProtobufEnum as ProtobufEnum_imported_for_functions;

#[derive(PartialEq,Clone,Default)]
pub struct Null {
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for Null {}

impl Null {
    pub fn new() -> Null {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static Null {
        static mut instance: ::protobuf::lazy::Lazy<Null> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const Null,
        };
        unsafe {
            instance.get(Null::new)
        }
    }
}

impl ::protobuf::Message for Null {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                _ => {
                    ::protobuf::rt::read_unknown_or_skip_group(field_number, wire_type, is, self.mut_unknown_fields())?;
                },
            };
        }
        ::std::result::Result::Ok(())
    }

    // Compute sizes of nested messages
    #[allow(unused_variables)]
    fn compute_size(&self) -> u32 {
        let mut my_size = 0;
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        os.write_unknown_fields(self.get_unknown_fields())?;
        ::std::result::Result::Ok(())
    }

    fn get_cached_size(&self) -> u32 {
        self.cached_size.get()
    }

    fn get_unknown_fields(&self) -> &::protobuf::UnknownFields {
        &self.unknown_fields
    }

    fn mut_unknown_fields(&mut self) -> &mut ::protobuf::UnknownFields {
        &mut self.unknown_fields
    }

    fn as_any(&self) -> &::std::any::Any {
        self as &::std::any::Any
    }
    fn as_any_mut(&mut self) -> &mut ::std::any::Any {
        self as &mut ::std::any::Any
    }
    fn into_any(self: Box<Self>) -> ::std::boxed::Box<::std::any::Any> {
        self
    }

    fn descriptor(&self) -> &'static ::protobuf::reflect::MessageDescriptor {
        ::protobuf::MessageStatic::descriptor_static(None::<Self>)
    }
}

impl ::protobuf::MessageStatic for Null {
    fn new() -> Null {
        Null::new()
    }

    fn descriptor_static(_: ::std::option::Option<Null>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let fields = ::std::vec::Vec::new();
                ::protobuf::reflect::MessageDescriptor::new::<Null>(
                    "Null",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for Null {
    fn clear(&mut self) {
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for Null {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for Null {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct Block {
    // message fields
    pub blockchain: ::std::string::String,
    pub hash: ::std::string::String,
    pub previous_hash: ::std::string::String,
    pub timestamp: u64,
    pub height: u64,
    pub merkle_root: ::std::string::String,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for Block {}

impl Block {
    pub fn new() -> Block {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static Block {
        static mut instance: ::protobuf::lazy::Lazy<Block> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const Block,
        };
        unsafe {
            instance.get(Block::new)
        }
    }

    // string blockchain = 1;

    pub fn clear_blockchain(&mut self) {
        self.blockchain.clear();
    }

    // Param is passed by value, moved
    pub fn set_blockchain(&mut self, v: ::std::string::String) {
        self.blockchain = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_blockchain(&mut self) -> &mut ::std::string::String {
        &mut self.blockchain
    }

    // Take field
    pub fn take_blockchain(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.blockchain, ::std::string::String::new())
    }

    pub fn get_blockchain(&self) -> &str {
        &self.blockchain
    }

    fn get_blockchain_for_reflect(&self) -> &::std::string::String {
        &self.blockchain
    }

    fn mut_blockchain_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.blockchain
    }

    // string hash = 2;

    pub fn clear_hash(&mut self) {
        self.hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_hash(&mut self, v: ::std::string::String) {
        self.hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_hash(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // Take field
    pub fn take_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.hash, ::std::string::String::new())
    }

    pub fn get_hash(&self) -> &str {
        &self.hash
    }

    fn get_hash_for_reflect(&self) -> &::std::string::String {
        &self.hash
    }

    fn mut_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // string previous_hash = 3;

    pub fn clear_previous_hash(&mut self) {
        self.previous_hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_previous_hash(&mut self, v: ::std::string::String) {
        self.previous_hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_previous_hash(&mut self) -> &mut ::std::string::String {
        &mut self.previous_hash
    }

    // Take field
    pub fn take_previous_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.previous_hash, ::std::string::String::new())
    }

    pub fn get_previous_hash(&self) -> &str {
        &self.previous_hash
    }

    fn get_previous_hash_for_reflect(&self) -> &::std::string::String {
        &self.previous_hash
    }

    fn mut_previous_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.previous_hash
    }

    // uint64 timestamp = 4;

    pub fn clear_timestamp(&mut self) {
        self.timestamp = 0;
    }

    // Param is passed by value, moved
    pub fn set_timestamp(&mut self, v: u64) {
        self.timestamp = v;
    }

    pub fn get_timestamp(&self) -> u64 {
        self.timestamp
    }

    fn get_timestamp_for_reflect(&self) -> &u64 {
        &self.timestamp
    }

    fn mut_timestamp_for_reflect(&mut self) -> &mut u64 {
        &mut self.timestamp
    }

    // uint64 height = 5;

    pub fn clear_height(&mut self) {
        self.height = 0;
    }

    // Param is passed by value, moved
    pub fn set_height(&mut self, v: u64) {
        self.height = v;
    }

    pub fn get_height(&self) -> u64 {
        self.height
    }

    fn get_height_for_reflect(&self) -> &u64 {
        &self.height
    }

    fn mut_height_for_reflect(&mut self) -> &mut u64 {
        &mut self.height
    }

    // string merkle_root = 6;

    pub fn clear_merkle_root(&mut self) {
        self.merkle_root.clear();
    }

    // Param is passed by value, moved
    pub fn set_merkle_root(&mut self, v: ::std::string::String) {
        self.merkle_root = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_merkle_root(&mut self) -> &mut ::std::string::String {
        &mut self.merkle_root
    }

    // Take field
    pub fn take_merkle_root(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.merkle_root, ::std::string::String::new())
    }

    pub fn get_merkle_root(&self) -> &str {
        &self.merkle_root
    }

    fn get_merkle_root_for_reflect(&self) -> &::std::string::String {
        &self.merkle_root
    }

    fn mut_merkle_root_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.merkle_root
    }
}

impl ::protobuf::Message for Block {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.blockchain)?;
                },
                2 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.hash)?;
                },
                3 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.previous_hash)?;
                },
                4 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.timestamp = tmp;
                },
                5 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.height = tmp;
                },
                6 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.merkle_root)?;
                },
                _ => {
                    ::protobuf::rt::read_unknown_or_skip_group(field_number, wire_type, is, self.mut_unknown_fields())?;
                },
            };
        }
        ::std::result::Result::Ok(())
    }

    // Compute sizes of nested messages
    #[allow(unused_variables)]
    fn compute_size(&self) -> u32 {
        let mut my_size = 0;
        if !self.blockchain.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.blockchain);
        }
        if !self.hash.is_empty() {
            my_size += ::protobuf::rt::string_size(2, &self.hash);
        }
        if !self.previous_hash.is_empty() {
            my_size += ::protobuf::rt::string_size(3, &self.previous_hash);
        }
        if self.timestamp != 0 {
            my_size += ::protobuf::rt::value_size(4, self.timestamp, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.height != 0 {
            my_size += ::protobuf::rt::value_size(5, self.height, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.merkle_root.is_empty() {
            my_size += ::protobuf::rt::string_size(6, &self.merkle_root);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.blockchain.is_empty() {
            os.write_string(1, &self.blockchain)?;
        }
        if !self.hash.is_empty() {
            os.write_string(2, &self.hash)?;
        }
        if !self.previous_hash.is_empty() {
            os.write_string(3, &self.previous_hash)?;
        }
        if self.timestamp != 0 {
            os.write_uint64(4, self.timestamp)?;
        }
        if self.height != 0 {
            os.write_uint64(5, self.height)?;
        }
        if !self.merkle_root.is_empty() {
            os.write_string(6, &self.merkle_root)?;
        }
        os.write_unknown_fields(self.get_unknown_fields())?;
        ::std::result::Result::Ok(())
    }

    fn get_cached_size(&self) -> u32 {
        self.cached_size.get()
    }

    fn get_unknown_fields(&self) -> &::protobuf::UnknownFields {
        &self.unknown_fields
    }

    fn mut_unknown_fields(&mut self) -> &mut ::protobuf::UnknownFields {
        &mut self.unknown_fields
    }

    fn as_any(&self) -> &::std::any::Any {
        self as &::std::any::Any
    }
    fn as_any_mut(&mut self) -> &mut ::std::any::Any {
        self as &mut ::std::any::Any
    }
    fn into_any(self: Box<Self>) -> ::std::boxed::Box<::std::any::Any> {
        self
    }

    fn descriptor(&self) -> &'static ::protobuf::reflect::MessageDescriptor {
        ::protobuf::MessageStatic::descriptor_static(None::<Self>)
    }
}

impl ::protobuf::MessageStatic for Block {
    fn new() -> Block {
        Block::new()
    }

    fn descriptor_static(_: ::std::option::Option<Block>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "blockchain",
                    Block::get_blockchain_for_reflect,
                    Block::mut_blockchain_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    Block::get_hash_for_reflect,
                    Block::mut_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "previous_hash",
                    Block::get_previous_hash_for_reflect,
                    Block::mut_previous_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "timestamp",
                    Block::get_timestamp_for_reflect,
                    Block::mut_timestamp_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "height",
                    Block::get_height_for_reflect,
                    Block::mut_height_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "merkle_root",
                    Block::get_merkle_root_for_reflect,
                    Block::mut_merkle_root_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<Block>(
                    "Block",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for Block {
    fn clear(&mut self) {
        self.clear_blockchain();
        self.clear_hash();
        self.clear_previous_hash();
        self.clear_timestamp();
        self.clear_height();
        self.clear_merkle_root();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for Block {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for Block {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct BcBlock {
    // message fields
    pub hash: ::std::string::String,
    pub height: u64,
    pub miner: ::std::string::String,
    pub difficulty: f32,
    pub timestamp: u64,
    pub merkle_root: ::std::string::String,
    pub chain_root: ::std::string::String,
    pub distance: u64,
    pub nonce: ::std::string::String,
    pub tx_count: u64,
    pub transactions: ::protobuf::RepeatedField<BcTransaction>,
    pub child_blockchain_count: u64,
    pub child_block_headers: ::protobuf::RepeatedField<ChildBlockHeader>,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BcBlock {}

impl BcBlock {
    pub fn new() -> BcBlock {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BcBlock {
        static mut instance: ::protobuf::lazy::Lazy<BcBlock> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BcBlock,
        };
        unsafe {
            instance.get(BcBlock::new)
        }
    }

    // string hash = 1;

    pub fn clear_hash(&mut self) {
        self.hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_hash(&mut self, v: ::std::string::String) {
        self.hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_hash(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // Take field
    pub fn take_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.hash, ::std::string::String::new())
    }

    pub fn get_hash(&self) -> &str {
        &self.hash
    }

    fn get_hash_for_reflect(&self) -> &::std::string::String {
        &self.hash
    }

    fn mut_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // uint64 height = 2;

    pub fn clear_height(&mut self) {
        self.height = 0;
    }

    // Param is passed by value, moved
    pub fn set_height(&mut self, v: u64) {
        self.height = v;
    }

    pub fn get_height(&self) -> u64 {
        self.height
    }

    fn get_height_for_reflect(&self) -> &u64 {
        &self.height
    }

    fn mut_height_for_reflect(&mut self) -> &mut u64 {
        &mut self.height
    }

    // string miner = 3;

    pub fn clear_miner(&mut self) {
        self.miner.clear();
    }

    // Param is passed by value, moved
    pub fn set_miner(&mut self, v: ::std::string::String) {
        self.miner = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_miner(&mut self) -> &mut ::std::string::String {
        &mut self.miner
    }

    // Take field
    pub fn take_miner(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.miner, ::std::string::String::new())
    }

    pub fn get_miner(&self) -> &str {
        &self.miner
    }

    fn get_miner_for_reflect(&self) -> &::std::string::String {
        &self.miner
    }

    fn mut_miner_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.miner
    }

    // float difficulty = 4;

    pub fn clear_difficulty(&mut self) {
        self.difficulty = 0.;
    }

    // Param is passed by value, moved
    pub fn set_difficulty(&mut self, v: f32) {
        self.difficulty = v;
    }

    pub fn get_difficulty(&self) -> f32 {
        self.difficulty
    }

    fn get_difficulty_for_reflect(&self) -> &f32 {
        &self.difficulty
    }

    fn mut_difficulty_for_reflect(&mut self) -> &mut f32 {
        &mut self.difficulty
    }

    // uint64 timestamp = 5;

    pub fn clear_timestamp(&mut self) {
        self.timestamp = 0;
    }

    // Param is passed by value, moved
    pub fn set_timestamp(&mut self, v: u64) {
        self.timestamp = v;
    }

    pub fn get_timestamp(&self) -> u64 {
        self.timestamp
    }

    fn get_timestamp_for_reflect(&self) -> &u64 {
        &self.timestamp
    }

    fn mut_timestamp_for_reflect(&mut self) -> &mut u64 {
        &mut self.timestamp
    }

    // string merkle_root = 6;

    pub fn clear_merkle_root(&mut self) {
        self.merkle_root.clear();
    }

    // Param is passed by value, moved
    pub fn set_merkle_root(&mut self, v: ::std::string::String) {
        self.merkle_root = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_merkle_root(&mut self) -> &mut ::std::string::String {
        &mut self.merkle_root
    }

    // Take field
    pub fn take_merkle_root(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.merkle_root, ::std::string::String::new())
    }

    pub fn get_merkle_root(&self) -> &str {
        &self.merkle_root
    }

    fn get_merkle_root_for_reflect(&self) -> &::std::string::String {
        &self.merkle_root
    }

    fn mut_merkle_root_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.merkle_root
    }

    // string chain_root = 7;

    pub fn clear_chain_root(&mut self) {
        self.chain_root.clear();
    }

    // Param is passed by value, moved
    pub fn set_chain_root(&mut self, v: ::std::string::String) {
        self.chain_root = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_chain_root(&mut self) -> &mut ::std::string::String {
        &mut self.chain_root
    }

    // Take field
    pub fn take_chain_root(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.chain_root, ::std::string::String::new())
    }

    pub fn get_chain_root(&self) -> &str {
        &self.chain_root
    }

    fn get_chain_root_for_reflect(&self) -> &::std::string::String {
        &self.chain_root
    }

    fn mut_chain_root_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.chain_root
    }

    // uint64 distance = 8;

    pub fn clear_distance(&mut self) {
        self.distance = 0;
    }

    // Param is passed by value, moved
    pub fn set_distance(&mut self, v: u64) {
        self.distance = v;
    }

    pub fn get_distance(&self) -> u64 {
        self.distance
    }

    fn get_distance_for_reflect(&self) -> &u64 {
        &self.distance
    }

    fn mut_distance_for_reflect(&mut self) -> &mut u64 {
        &mut self.distance
    }

    // string nonce = 9;

    pub fn clear_nonce(&mut self) {
        self.nonce.clear();
    }

    // Param is passed by value, moved
    pub fn set_nonce(&mut self, v: ::std::string::String) {
        self.nonce = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_nonce(&mut self) -> &mut ::std::string::String {
        &mut self.nonce
    }

    // Take field
    pub fn take_nonce(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.nonce, ::std::string::String::new())
    }

    pub fn get_nonce(&self) -> &str {
        &self.nonce
    }

    fn get_nonce_for_reflect(&self) -> &::std::string::String {
        &self.nonce
    }

    fn mut_nonce_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.nonce
    }

    // uint64 tx_count = 10;

    pub fn clear_tx_count(&mut self) {
        self.tx_count = 0;
    }

    // Param is passed by value, moved
    pub fn set_tx_count(&mut self, v: u64) {
        self.tx_count = v;
    }

    pub fn get_tx_count(&self) -> u64 {
        self.tx_count
    }

    fn get_tx_count_for_reflect(&self) -> &u64 {
        &self.tx_count
    }

    fn mut_tx_count_for_reflect(&mut self) -> &mut u64 {
        &mut self.tx_count
    }

    // repeated .bc.BcTransaction transactions = 11;

    pub fn clear_transactions(&mut self) {
        self.transactions.clear();
    }

    // Param is passed by value, moved
    pub fn set_transactions(&mut self, v: ::protobuf::RepeatedField<BcTransaction>) {
        self.transactions = v;
    }

    // Mutable pointer to the field.
    pub fn mut_transactions(&mut self) -> &mut ::protobuf::RepeatedField<BcTransaction> {
        &mut self.transactions
    }

    // Take field
    pub fn take_transactions(&mut self) -> ::protobuf::RepeatedField<BcTransaction> {
        ::std::mem::replace(&mut self.transactions, ::protobuf::RepeatedField::new())
    }

    pub fn get_transactions(&self) -> &[BcTransaction] {
        &self.transactions
    }

    fn get_transactions_for_reflect(&self) -> &::protobuf::RepeatedField<BcTransaction> {
        &self.transactions
    }

    fn mut_transactions_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BcTransaction> {
        &mut self.transactions
    }

    // uint64 child_blockchain_count = 12;

    pub fn clear_child_blockchain_count(&mut self) {
        self.child_blockchain_count = 0;
    }

    // Param is passed by value, moved
    pub fn set_child_blockchain_count(&mut self, v: u64) {
        self.child_blockchain_count = v;
    }

    pub fn get_child_blockchain_count(&self) -> u64 {
        self.child_blockchain_count
    }

    fn get_child_blockchain_count_for_reflect(&self) -> &u64 {
        &self.child_blockchain_count
    }

    fn mut_child_blockchain_count_for_reflect(&mut self) -> &mut u64 {
        &mut self.child_blockchain_count
    }

    // repeated .bc.ChildBlockHeader child_block_headers = 13;

    pub fn clear_child_block_headers(&mut self) {
        self.child_block_headers.clear();
    }

    // Param is passed by value, moved
    pub fn set_child_block_headers(&mut self, v: ::protobuf::RepeatedField<ChildBlockHeader>) {
        self.child_block_headers = v;
    }

    // Mutable pointer to the field.
    pub fn mut_child_block_headers(&mut self) -> &mut ::protobuf::RepeatedField<ChildBlockHeader> {
        &mut self.child_block_headers
    }

    // Take field
    pub fn take_child_block_headers(&mut self) -> ::protobuf::RepeatedField<ChildBlockHeader> {
        ::std::mem::replace(&mut self.child_block_headers, ::protobuf::RepeatedField::new())
    }

    pub fn get_child_block_headers(&self) -> &[ChildBlockHeader] {
        &self.child_block_headers
    }

    fn get_child_block_headers_for_reflect(&self) -> &::protobuf::RepeatedField<ChildBlockHeader> {
        &self.child_block_headers
    }

    fn mut_child_block_headers_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<ChildBlockHeader> {
        &mut self.child_block_headers
    }
}

impl ::protobuf::Message for BcBlock {
    fn is_initialized(&self) -> bool {
        for v in &self.transactions {
            if !v.is_initialized() {
                return false;
            }
        };
        for v in &self.child_block_headers {
            if !v.is_initialized() {
                return false;
            }
        };
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.hash)?;
                },
                2 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.height = tmp;
                },
                3 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.miner)?;
                },
                4 => {
                    if wire_type != ::protobuf::wire_format::WireTypeFixed32 {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_float()?;
                    self.difficulty = tmp;
                },
                5 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.timestamp = tmp;
                },
                6 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.merkle_root)?;
                },
                7 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.chain_root)?;
                },
                8 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.distance = tmp;
                },
                9 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.nonce)?;
                },
                10 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.tx_count = tmp;
                },
                11 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.transactions)?;
                },
                12 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.child_blockchain_count = tmp;
                },
                13 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.child_block_headers)?;
                },
                _ => {
                    ::protobuf::rt::read_unknown_or_skip_group(field_number, wire_type, is, self.mut_unknown_fields())?;
                },
            };
        }
        ::std::result::Result::Ok(())
    }

    // Compute sizes of nested messages
    #[allow(unused_variables)]
    fn compute_size(&self) -> u32 {
        let mut my_size = 0;
        if !self.hash.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.hash);
        }
        if self.height != 0 {
            my_size += ::protobuf::rt::value_size(2, self.height, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.miner.is_empty() {
            my_size += ::protobuf::rt::string_size(3, &self.miner);
        }
        if self.difficulty != 0. {
            my_size += 5;
        }
        if self.timestamp != 0 {
            my_size += ::protobuf::rt::value_size(5, self.timestamp, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.merkle_root.is_empty() {
            my_size += ::protobuf::rt::string_size(6, &self.merkle_root);
        }
        if !self.chain_root.is_empty() {
            my_size += ::protobuf::rt::string_size(7, &self.chain_root);
        }
        if self.distance != 0 {
            my_size += ::protobuf::rt::value_size(8, self.distance, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.nonce.is_empty() {
            my_size += ::protobuf::rt::string_size(9, &self.nonce);
        }
        if self.tx_count != 0 {
            my_size += ::protobuf::rt::value_size(10, self.tx_count, ::protobuf::wire_format::WireTypeVarint);
        }
        for value in &self.transactions {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        if self.child_blockchain_count != 0 {
            my_size += ::protobuf::rt::value_size(12, self.child_blockchain_count, ::protobuf::wire_format::WireTypeVarint);
        }
        for value in &self.child_block_headers {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.hash.is_empty() {
            os.write_string(1, &self.hash)?;
        }
        if self.height != 0 {
            os.write_uint64(2, self.height)?;
        }
        if !self.miner.is_empty() {
            os.write_string(3, &self.miner)?;
        }
        if self.difficulty != 0. {
            os.write_float(4, self.difficulty)?;
        }
        if self.timestamp != 0 {
            os.write_uint64(5, self.timestamp)?;
        }
        if !self.merkle_root.is_empty() {
            os.write_string(6, &self.merkle_root)?;
        }
        if !self.chain_root.is_empty() {
            os.write_string(7, &self.chain_root)?;
        }
        if self.distance != 0 {
            os.write_uint64(8, self.distance)?;
        }
        if !self.nonce.is_empty() {
            os.write_string(9, &self.nonce)?;
        }
        if self.tx_count != 0 {
            os.write_uint64(10, self.tx_count)?;
        }
        for v in &self.transactions {
            os.write_tag(11, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        if self.child_blockchain_count != 0 {
            os.write_uint64(12, self.child_blockchain_count)?;
        }
        for v in &self.child_block_headers {
            os.write_tag(13, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        os.write_unknown_fields(self.get_unknown_fields())?;
        ::std::result::Result::Ok(())
    }

    fn get_cached_size(&self) -> u32 {
        self.cached_size.get()
    }

    fn get_unknown_fields(&self) -> &::protobuf::UnknownFields {
        &self.unknown_fields
    }

    fn mut_unknown_fields(&mut self) -> &mut ::protobuf::UnknownFields {
        &mut self.unknown_fields
    }

    fn as_any(&self) -> &::std::any::Any {
        self as &::std::any::Any
    }
    fn as_any_mut(&mut self) -> &mut ::std::any::Any {
        self as &mut ::std::any::Any
    }
    fn into_any(self: Box<Self>) -> ::std::boxed::Box<::std::any::Any> {
        self
    }

    fn descriptor(&self) -> &'static ::protobuf::reflect::MessageDescriptor {
        ::protobuf::MessageStatic::descriptor_static(None::<Self>)
    }
}

impl ::protobuf::MessageStatic for BcBlock {
    fn new() -> BcBlock {
        BcBlock::new()
    }

    fn descriptor_static(_: ::std::option::Option<BcBlock>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    BcBlock::get_hash_for_reflect,
                    BcBlock::mut_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "height",
                    BcBlock::get_height_for_reflect,
                    BcBlock::mut_height_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "miner",
                    BcBlock::get_miner_for_reflect,
                    BcBlock::mut_miner_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeFloat>(
                    "difficulty",
                    BcBlock::get_difficulty_for_reflect,
                    BcBlock::mut_difficulty_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "timestamp",
                    BcBlock::get_timestamp_for_reflect,
                    BcBlock::mut_timestamp_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "merkle_root",
                    BcBlock::get_merkle_root_for_reflect,
                    BcBlock::mut_merkle_root_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "chain_root",
                    BcBlock::get_chain_root_for_reflect,
                    BcBlock::mut_chain_root_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "distance",
                    BcBlock::get_distance_for_reflect,
                    BcBlock::mut_distance_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "nonce",
                    BcBlock::get_nonce_for_reflect,
                    BcBlock::mut_nonce_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "tx_count",
                    BcBlock::get_tx_count_for_reflect,
                    BcBlock::mut_tx_count_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BcTransaction>>(
                    "transactions",
                    BcBlock::get_transactions_for_reflect,
                    BcBlock::mut_transactions_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "child_blockchain_count",
                    BcBlock::get_child_blockchain_count_for_reflect,
                    BcBlock::mut_child_blockchain_count_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<ChildBlockHeader>>(
                    "child_block_headers",
                    BcBlock::get_child_block_headers_for_reflect,
                    BcBlock::mut_child_block_headers_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BcBlock>(
                    "BcBlock",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BcBlock {
    fn clear(&mut self) {
        self.clear_hash();
        self.clear_height();
        self.clear_miner();
        self.clear_difficulty();
        self.clear_timestamp();
        self.clear_merkle_root();
        self.clear_chain_root();
        self.clear_distance();
        self.clear_nonce();
        self.clear_tx_count();
        self.clear_transactions();
        self.clear_child_blockchain_count();
        self.clear_child_block_headers();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BcBlock {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BcBlock {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct BcTransaction {
    // message fields
    pub hash: ::std::string::String,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BcTransaction {}

impl BcTransaction {
    pub fn new() -> BcTransaction {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BcTransaction {
        static mut instance: ::protobuf::lazy::Lazy<BcTransaction> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BcTransaction,
        };
        unsafe {
            instance.get(BcTransaction::new)
        }
    }

    // string hash = 1;

    pub fn clear_hash(&mut self) {
        self.hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_hash(&mut self, v: ::std::string::String) {
        self.hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_hash(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // Take field
    pub fn take_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.hash, ::std::string::String::new())
    }

    pub fn get_hash(&self) -> &str {
        &self.hash
    }

    fn get_hash_for_reflect(&self) -> &::std::string::String {
        &self.hash
    }

    fn mut_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }
}

impl ::protobuf::Message for BcTransaction {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.hash)?;
                },
                _ => {
                    ::protobuf::rt::read_unknown_or_skip_group(field_number, wire_type, is, self.mut_unknown_fields())?;
                },
            };
        }
        ::std::result::Result::Ok(())
    }

    // Compute sizes of nested messages
    #[allow(unused_variables)]
    fn compute_size(&self) -> u32 {
        let mut my_size = 0;
        if !self.hash.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.hash);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.hash.is_empty() {
            os.write_string(1, &self.hash)?;
        }
        os.write_unknown_fields(self.get_unknown_fields())?;
        ::std::result::Result::Ok(())
    }

    fn get_cached_size(&self) -> u32 {
        self.cached_size.get()
    }

    fn get_unknown_fields(&self) -> &::protobuf::UnknownFields {
        &self.unknown_fields
    }

    fn mut_unknown_fields(&mut self) -> &mut ::protobuf::UnknownFields {
        &mut self.unknown_fields
    }

    fn as_any(&self) -> &::std::any::Any {
        self as &::std::any::Any
    }
    fn as_any_mut(&mut self) -> &mut ::std::any::Any {
        self as &mut ::std::any::Any
    }
    fn into_any(self: Box<Self>) -> ::std::boxed::Box<::std::any::Any> {
        self
    }

    fn descriptor(&self) -> &'static ::protobuf::reflect::MessageDescriptor {
        ::protobuf::MessageStatic::descriptor_static(None::<Self>)
    }
}

impl ::protobuf::MessageStatic for BcTransaction {
    fn new() -> BcTransaction {
        BcTransaction::new()
    }

    fn descriptor_static(_: ::std::option::Option<BcTransaction>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    BcTransaction::get_hash_for_reflect,
                    BcTransaction::mut_hash_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BcTransaction>(
                    "BcTransaction",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BcTransaction {
    fn clear(&mut self) {
        self.clear_hash();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BcTransaction {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BcTransaction {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct ChildBlockHeader {
    // message fields
    pub blockchain: ::std::string::String,
    pub hash: ::std::string::String,
    pub previous_hash: ::std::string::String,
    pub timestamp: u64,
    pub height: u64,
    pub merkle_root: ::std::string::String,
    pub child_block_confirmations_in_parent: u64,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for ChildBlockHeader {}

impl ChildBlockHeader {
    pub fn new() -> ChildBlockHeader {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static ChildBlockHeader {
        static mut instance: ::protobuf::lazy::Lazy<ChildBlockHeader> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ChildBlockHeader,
        };
        unsafe {
            instance.get(ChildBlockHeader::new)
        }
    }

    // string blockchain = 1;

    pub fn clear_blockchain(&mut self) {
        self.blockchain.clear();
    }

    // Param is passed by value, moved
    pub fn set_blockchain(&mut self, v: ::std::string::String) {
        self.blockchain = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_blockchain(&mut self) -> &mut ::std::string::String {
        &mut self.blockchain
    }

    // Take field
    pub fn take_blockchain(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.blockchain, ::std::string::String::new())
    }

    pub fn get_blockchain(&self) -> &str {
        &self.blockchain
    }

    fn get_blockchain_for_reflect(&self) -> &::std::string::String {
        &self.blockchain
    }

    fn mut_blockchain_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.blockchain
    }

    // string hash = 2;

    pub fn clear_hash(&mut self) {
        self.hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_hash(&mut self, v: ::std::string::String) {
        self.hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_hash(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // Take field
    pub fn take_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.hash, ::std::string::String::new())
    }

    pub fn get_hash(&self) -> &str {
        &self.hash
    }

    fn get_hash_for_reflect(&self) -> &::std::string::String {
        &self.hash
    }

    fn mut_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.hash
    }

    // string previous_hash = 3;

    pub fn clear_previous_hash(&mut self) {
        self.previous_hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_previous_hash(&mut self, v: ::std::string::String) {
        self.previous_hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_previous_hash(&mut self) -> &mut ::std::string::String {
        &mut self.previous_hash
    }

    // Take field
    pub fn take_previous_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.previous_hash, ::std::string::String::new())
    }

    pub fn get_previous_hash(&self) -> &str {
        &self.previous_hash
    }

    fn get_previous_hash_for_reflect(&self) -> &::std::string::String {
        &self.previous_hash
    }

    fn mut_previous_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.previous_hash
    }

    // uint64 timestamp = 4;

    pub fn clear_timestamp(&mut self) {
        self.timestamp = 0;
    }

    // Param is passed by value, moved
    pub fn set_timestamp(&mut self, v: u64) {
        self.timestamp = v;
    }

    pub fn get_timestamp(&self) -> u64 {
        self.timestamp
    }

    fn get_timestamp_for_reflect(&self) -> &u64 {
        &self.timestamp
    }

    fn mut_timestamp_for_reflect(&mut self) -> &mut u64 {
        &mut self.timestamp
    }

    // uint64 height = 5;

    pub fn clear_height(&mut self) {
        self.height = 0;
    }

    // Param is passed by value, moved
    pub fn set_height(&mut self, v: u64) {
        self.height = v;
    }

    pub fn get_height(&self) -> u64 {
        self.height
    }

    fn get_height_for_reflect(&self) -> &u64 {
        &self.height
    }

    fn mut_height_for_reflect(&mut self) -> &mut u64 {
        &mut self.height
    }

    // string merkle_root = 6;

    pub fn clear_merkle_root(&mut self) {
        self.merkle_root.clear();
    }

    // Param is passed by value, moved
    pub fn set_merkle_root(&mut self, v: ::std::string::String) {
        self.merkle_root = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_merkle_root(&mut self) -> &mut ::std::string::String {
        &mut self.merkle_root
    }

    // Take field
    pub fn take_merkle_root(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.merkle_root, ::std::string::String::new())
    }

    pub fn get_merkle_root(&self) -> &str {
        &self.merkle_root
    }

    fn get_merkle_root_for_reflect(&self) -> &::std::string::String {
        &self.merkle_root
    }

    fn mut_merkle_root_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.merkle_root
    }

    // uint64 child_block_confirmations_in_parent = 7;

    pub fn clear_child_block_confirmations_in_parent(&mut self) {
        self.child_block_confirmations_in_parent = 0;
    }

    // Param is passed by value, moved
    pub fn set_child_block_confirmations_in_parent(&mut self, v: u64) {
        self.child_block_confirmations_in_parent = v;
    }

    pub fn get_child_block_confirmations_in_parent(&self) -> u64 {
        self.child_block_confirmations_in_parent
    }

    fn get_child_block_confirmations_in_parent_for_reflect(&self) -> &u64 {
        &self.child_block_confirmations_in_parent
    }

    fn mut_child_block_confirmations_in_parent_for_reflect(&mut self) -> &mut u64 {
        &mut self.child_block_confirmations_in_parent
    }
}

impl ::protobuf::Message for ChildBlockHeader {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.blockchain)?;
                },
                2 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.hash)?;
                },
                3 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.previous_hash)?;
                },
                4 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.timestamp = tmp;
                },
                5 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.height = tmp;
                },
                6 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.merkle_root)?;
                },
                7 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.child_block_confirmations_in_parent = tmp;
                },
                _ => {
                    ::protobuf::rt::read_unknown_or_skip_group(field_number, wire_type, is, self.mut_unknown_fields())?;
                },
            };
        }
        ::std::result::Result::Ok(())
    }

    // Compute sizes of nested messages
    #[allow(unused_variables)]
    fn compute_size(&self) -> u32 {
        let mut my_size = 0;
        if !self.blockchain.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.blockchain);
        }
        if !self.hash.is_empty() {
            my_size += ::protobuf::rt::string_size(2, &self.hash);
        }
        if !self.previous_hash.is_empty() {
            my_size += ::protobuf::rt::string_size(3, &self.previous_hash);
        }
        if self.timestamp != 0 {
            my_size += ::protobuf::rt::value_size(4, self.timestamp, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.height != 0 {
            my_size += ::protobuf::rt::value_size(5, self.height, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.merkle_root.is_empty() {
            my_size += ::protobuf::rt::string_size(6, &self.merkle_root);
        }
        if self.child_block_confirmations_in_parent != 0 {
            my_size += ::protobuf::rt::value_size(7, self.child_block_confirmations_in_parent, ::protobuf::wire_format::WireTypeVarint);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.blockchain.is_empty() {
            os.write_string(1, &self.blockchain)?;
        }
        if !self.hash.is_empty() {
            os.write_string(2, &self.hash)?;
        }
        if !self.previous_hash.is_empty() {
            os.write_string(3, &self.previous_hash)?;
        }
        if self.timestamp != 0 {
            os.write_uint64(4, self.timestamp)?;
        }
        if self.height != 0 {
            os.write_uint64(5, self.height)?;
        }
        if !self.merkle_root.is_empty() {
            os.write_string(6, &self.merkle_root)?;
        }
        if self.child_block_confirmations_in_parent != 0 {
            os.write_uint64(7, self.child_block_confirmations_in_parent)?;
        }
        os.write_unknown_fields(self.get_unknown_fields())?;
        ::std::result::Result::Ok(())
    }

    fn get_cached_size(&self) -> u32 {
        self.cached_size.get()
    }

    fn get_unknown_fields(&self) -> &::protobuf::UnknownFields {
        &self.unknown_fields
    }

    fn mut_unknown_fields(&mut self) -> &mut ::protobuf::UnknownFields {
        &mut self.unknown_fields
    }

    fn as_any(&self) -> &::std::any::Any {
        self as &::std::any::Any
    }
    fn as_any_mut(&mut self) -> &mut ::std::any::Any {
        self as &mut ::std::any::Any
    }
    fn into_any(self: Box<Self>) -> ::std::boxed::Box<::std::any::Any> {
        self
    }

    fn descriptor(&self) -> &'static ::protobuf::reflect::MessageDescriptor {
        ::protobuf::MessageStatic::descriptor_static(None::<Self>)
    }
}

impl ::protobuf::MessageStatic for ChildBlockHeader {
    fn new() -> ChildBlockHeader {
        ChildBlockHeader::new()
    }

    fn descriptor_static(_: ::std::option::Option<ChildBlockHeader>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "blockchain",
                    ChildBlockHeader::get_blockchain_for_reflect,
                    ChildBlockHeader::mut_blockchain_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    ChildBlockHeader::get_hash_for_reflect,
                    ChildBlockHeader::mut_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "previous_hash",
                    ChildBlockHeader::get_previous_hash_for_reflect,
                    ChildBlockHeader::mut_previous_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "timestamp",
                    ChildBlockHeader::get_timestamp_for_reflect,
                    ChildBlockHeader::mut_timestamp_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "height",
                    ChildBlockHeader::get_height_for_reflect,
                    ChildBlockHeader::mut_height_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "merkle_root",
                    ChildBlockHeader::get_merkle_root_for_reflect,
                    ChildBlockHeader::mut_merkle_root_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "child_block_confirmations_in_parent",
                    ChildBlockHeader::get_child_block_confirmations_in_parent_for_reflect,
                    ChildBlockHeader::mut_child_block_confirmations_in_parent_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<ChildBlockHeader>(
                    "ChildBlockHeader",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for ChildBlockHeader {
    fn clear(&mut self) {
        self.clear_blockchain();
        self.clear_hash();
        self.clear_previous_hash();
        self.clear_timestamp();
        self.clear_height();
        self.clear_merkle_root();
        self.clear_child_block_confirmations_in_parent();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for ChildBlockHeader {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for ChildBlockHeader {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\ncore.proto\x12\x02bc\"\x06\n\x04Null\"\xb7\x01\n\x05Block\x12\x1e\n\
    \nblockchain\x18\x01\x20\x01(\tR\nblockchain\x12\x12\n\x04hash\x18\x02\
    \x20\x01(\tR\x04hash\x12#\n\rprevious_hash\x18\x03\x20\x01(\tR\x0cprevio\
    usHash\x12\x1c\n\ttimestamp\x18\x04\x20\x01(\x04R\ttimestamp\x12\x16\n\
    \x06height\x18\x05\x20\x01(\x04R\x06height\x12\x1f\n\x0bmerkle_root\x18\
    \x06\x20\x01(\tR\nmerkleRoot\"\xc9\x03\n\x07BcBlock\x12\x12\n\x04hash\
    \x18\x01\x20\x01(\tR\x04hash\x12\x16\n\x06height\x18\x02\x20\x01(\x04R\
    \x06height\x12\x14\n\x05miner\x18\x03\x20\x01(\tR\x05miner\x12\x1e\n\ndi\
    fficulty\x18\x04\x20\x01(\x02R\ndifficulty\x12\x1c\n\ttimestamp\x18\x05\
    \x20\x01(\x04R\ttimestamp\x12\x1f\n\x0bmerkle_root\x18\x06\x20\x01(\tR\n\
    merkleRoot\x12\x1d\n\nchain_root\x18\x07\x20\x01(\tR\tchainRoot\x12\x1a\
    \n\x08distance\x18\x08\x20\x01(\x04R\x08distance\x12\x14\n\x05nonce\x18\
    \t\x20\x01(\tR\x05nonce\x12\x19\n\x08tx_count\x18\n\x20\x01(\x04R\x07txC\
    ount\x125\n\x0ctransactions\x18\x0b\x20\x03(\x0b2\x11.bc.BcTransactionR\
    \x0ctransactions\x124\n\x16child_blockchain_count\x18\x0c\x20\x01(\x04R\
    \x14childBlockchainCount\x12D\n\x13child_block_headers\x18\r\x20\x03(\
    \x0b2\x14.bc.ChildBlockHeaderR\x11childBlockHeaders\"#\n\rBcTransaction\
    \x12\x12\n\x04hash\x18\x01\x20\x01(\tR\x04hash\"\x90\x02\n\x10ChildBlock\
    Header\x12\x1e\n\nblockchain\x18\x01\x20\x01(\tR\nblockchain\x12\x12\n\
    \x04hash\x18\x02\x20\x01(\tR\x04hash\x12#\n\rprevious_hash\x18\x03\x20\
    \x01(\tR\x0cpreviousHash\x12\x1c\n\ttimestamp\x18\x04\x20\x01(\x04R\ttim\
    estamp\x12\x16\n\x06height\x18\x05\x20\x01(\x04R\x06height\x12\x1f\n\x0b\
    merkle_root\x18\x06\x20\x01(\tR\nmerkleRoot\x12L\n#child_block_confirmat\
    ions_in_parent\x18\x07\x20\x01(\x04R\x1fchildBlockConfirmationsInParentb\
    \x06proto3\
";

static mut file_descriptor_proto_lazy: ::protobuf::lazy::Lazy<::protobuf::descriptor::FileDescriptorProto> = ::protobuf::lazy::Lazy {
    lock: ::protobuf::lazy::ONCE_INIT,
    ptr: 0 as *const ::protobuf::descriptor::FileDescriptorProto,
};

fn parse_descriptor_proto() -> ::protobuf::descriptor::FileDescriptorProto {
    ::protobuf::parse_from_bytes(file_descriptor_proto_data).unwrap()
}

pub fn file_descriptor_proto() -> &'static ::protobuf::descriptor::FileDescriptorProto {
    unsafe {
        file_descriptor_proto_lazy.get(|| {
            parse_descriptor_proto()
        })
    }
}
