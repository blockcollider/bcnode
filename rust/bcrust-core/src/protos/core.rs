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
pub struct BlockchainHeaders {
    // message fields
    pub btc: ::protobuf::RepeatedField<BlockchainHeader>,
    pub eth: ::protobuf::RepeatedField<BlockchainHeader>,
    pub lsk: ::protobuf::RepeatedField<BlockchainHeader>,
    pub neo: ::protobuf::RepeatedField<BlockchainHeader>,
    pub wav: ::protobuf::RepeatedField<BlockchainHeader>,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BlockchainHeaders {}

impl BlockchainHeaders {
    pub fn new() -> BlockchainHeaders {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BlockchainHeaders {
        static mut instance: ::protobuf::lazy::Lazy<BlockchainHeaders> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BlockchainHeaders,
        };
        unsafe {
            instance.get(BlockchainHeaders::new)
        }
    }

    // repeated .bc.BlockchainHeader btc = 1;

    pub fn clear_btc(&mut self) {
        self.btc.clear();
    }

    // Param is passed by value, moved
    pub fn set_btc(&mut self, v: ::protobuf::RepeatedField<BlockchainHeader>) {
        self.btc = v;
    }

    // Mutable pointer to the field.
    pub fn mut_btc(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.btc
    }

    // Take field
    pub fn take_btc(&mut self) -> ::protobuf::RepeatedField<BlockchainHeader> {
        ::std::mem::replace(&mut self.btc, ::protobuf::RepeatedField::new())
    }

    pub fn get_btc(&self) -> &[BlockchainHeader] {
        &self.btc
    }

    fn get_btc_for_reflect(&self) -> &::protobuf::RepeatedField<BlockchainHeader> {
        &self.btc
    }

    fn mut_btc_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.btc
    }

    // repeated .bc.BlockchainHeader eth = 2;

    pub fn clear_eth(&mut self) {
        self.eth.clear();
    }

    // Param is passed by value, moved
    pub fn set_eth(&mut self, v: ::protobuf::RepeatedField<BlockchainHeader>) {
        self.eth = v;
    }

    // Mutable pointer to the field.
    pub fn mut_eth(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.eth
    }

    // Take field
    pub fn take_eth(&mut self) -> ::protobuf::RepeatedField<BlockchainHeader> {
        ::std::mem::replace(&mut self.eth, ::protobuf::RepeatedField::new())
    }

    pub fn get_eth(&self) -> &[BlockchainHeader] {
        &self.eth
    }

    fn get_eth_for_reflect(&self) -> &::protobuf::RepeatedField<BlockchainHeader> {
        &self.eth
    }

    fn mut_eth_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.eth
    }

    // repeated .bc.BlockchainHeader lsk = 3;

    pub fn clear_lsk(&mut self) {
        self.lsk.clear();
    }

    // Param is passed by value, moved
    pub fn set_lsk(&mut self, v: ::protobuf::RepeatedField<BlockchainHeader>) {
        self.lsk = v;
    }

    // Mutable pointer to the field.
    pub fn mut_lsk(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.lsk
    }

    // Take field
    pub fn take_lsk(&mut self) -> ::protobuf::RepeatedField<BlockchainHeader> {
        ::std::mem::replace(&mut self.lsk, ::protobuf::RepeatedField::new())
    }

    pub fn get_lsk(&self) -> &[BlockchainHeader] {
        &self.lsk
    }

    fn get_lsk_for_reflect(&self) -> &::protobuf::RepeatedField<BlockchainHeader> {
        &self.lsk
    }

    fn mut_lsk_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.lsk
    }

    // repeated .bc.BlockchainHeader neo = 4;

    pub fn clear_neo(&mut self) {
        self.neo.clear();
    }

    // Param is passed by value, moved
    pub fn set_neo(&mut self, v: ::protobuf::RepeatedField<BlockchainHeader>) {
        self.neo = v;
    }

    // Mutable pointer to the field.
    pub fn mut_neo(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.neo
    }

    // Take field
    pub fn take_neo(&mut self) -> ::protobuf::RepeatedField<BlockchainHeader> {
        ::std::mem::replace(&mut self.neo, ::protobuf::RepeatedField::new())
    }

    pub fn get_neo(&self) -> &[BlockchainHeader] {
        &self.neo
    }

    fn get_neo_for_reflect(&self) -> &::protobuf::RepeatedField<BlockchainHeader> {
        &self.neo
    }

    fn mut_neo_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.neo
    }

    // repeated .bc.BlockchainHeader wav = 5;

    pub fn clear_wav(&mut self) {
        self.wav.clear();
    }

    // Param is passed by value, moved
    pub fn set_wav(&mut self, v: ::protobuf::RepeatedField<BlockchainHeader>) {
        self.wav = v;
    }

    // Mutable pointer to the field.
    pub fn mut_wav(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.wav
    }

    // Take field
    pub fn take_wav(&mut self) -> ::protobuf::RepeatedField<BlockchainHeader> {
        ::std::mem::replace(&mut self.wav, ::protobuf::RepeatedField::new())
    }

    pub fn get_wav(&self) -> &[BlockchainHeader] {
        &self.wav
    }

    fn get_wav_for_reflect(&self) -> &::protobuf::RepeatedField<BlockchainHeader> {
        &self.wav
    }

    fn mut_wav_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHeader> {
        &mut self.wav
    }
}

impl ::protobuf::Message for BlockchainHeaders {
    fn is_initialized(&self) -> bool {
        for v in &self.btc {
            if !v.is_initialized() {
                return false;
            }
        };
        for v in &self.eth {
            if !v.is_initialized() {
                return false;
            }
        };
        for v in &self.lsk {
            if !v.is_initialized() {
                return false;
            }
        };
        for v in &self.neo {
            if !v.is_initialized() {
                return false;
            }
        };
        for v in &self.wav {
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
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.btc)?;
                },
                2 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.eth)?;
                },
                3 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.lsk)?;
                },
                4 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.neo)?;
                },
                5 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.wav)?;
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
        for value in &self.btc {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        for value in &self.eth {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        for value in &self.lsk {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        for value in &self.neo {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        for value in &self.wav {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        for v in &self.btc {
            os.write_tag(1, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        for v in &self.eth {
            os.write_tag(2, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        for v in &self.lsk {
            os.write_tag(3, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        for v in &self.neo {
            os.write_tag(4, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        for v in &self.wav {
            os.write_tag(5, ::protobuf::wire_format::WireTypeLengthDelimited)?;
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

impl ::protobuf::MessageStatic for BlockchainHeaders {
    fn new() -> BlockchainHeaders {
        BlockchainHeaders::new()
    }

    fn descriptor_static(_: ::std::option::Option<BlockchainHeaders>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHeader>>(
                    "btc",
                    BlockchainHeaders::get_btc_for_reflect,
                    BlockchainHeaders::mut_btc_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHeader>>(
                    "eth",
                    BlockchainHeaders::get_eth_for_reflect,
                    BlockchainHeaders::mut_eth_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHeader>>(
                    "lsk",
                    BlockchainHeaders::get_lsk_for_reflect,
                    BlockchainHeaders::mut_lsk_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHeader>>(
                    "neo",
                    BlockchainHeaders::get_neo_for_reflect,
                    BlockchainHeaders::mut_neo_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHeader>>(
                    "wav",
                    BlockchainHeaders::get_wav_for_reflect,
                    BlockchainHeaders::mut_wav_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BlockchainHeaders>(
                    "BlockchainHeaders",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BlockchainHeaders {
    fn clear(&mut self) {
        self.clear_btc();
        self.clear_eth();
        self.clear_lsk();
        self.clear_neo();
        self.clear_wav();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BlockchainHeaders {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BlockchainHeaders {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct BcBlock {
    // message fields
    pub hash: ::std::string::String,
    pub previous_hash: ::std::string::String,
    pub version: u64,
    pub schema_version: u64,
    pub height: u64,
    pub miner: ::std::string::String,
    pub difficulty: f32,
    pub timestamp: u64,
    pub merkle_root: ::std::string::String,
    pub chain_root: ::std::string::String,
    pub distance: u64,
    pub nonce: ::std::string::String,
    pub nrg_grant: u64,
    pub target_hash: ::std::string::String,
    pub target_height: u64,
    pub target_miner: ::std::string::String,
    pub target_signature: ::std::string::String,
    pub twn: u64,
    pub tws: ::protobuf::RepeatedField<::std::string::String>,
    pub emblem_weight: u64,
    pub emblem_chain_block_hash: ::std::string::String,
    pub emblem_chain_fingerprint_root: ::std::string::String,
    pub emblem_chain_address: ::std::string::String,
    pub tx_count: u64,
    pub txs: ::protobuf::RepeatedField<BcTransaction>,
    pub tx_fee_base: u64,
    pub tx_distance_sum_limit: u64,
    pub blockchain_headers_count: u64,
    pub blockchain_headers: ::protobuf::SingularPtrField<BlockchainHeaders>,
    pub blockchain_fingerprints_root: ::std::string::String,
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

    // string previous_hash = 2;

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

    // uint64 version = 3;

    pub fn clear_version(&mut self) {
        self.version = 0;
    }

    // Param is passed by value, moved
    pub fn set_version(&mut self, v: u64) {
        self.version = v;
    }

    pub fn get_version(&self) -> u64 {
        self.version
    }

    fn get_version_for_reflect(&self) -> &u64 {
        &self.version
    }

    fn mut_version_for_reflect(&mut self) -> &mut u64 {
        &mut self.version
    }

    // uint64 schema_version = 4;

    pub fn clear_schema_version(&mut self) {
        self.schema_version = 0;
    }

    // Param is passed by value, moved
    pub fn set_schema_version(&mut self, v: u64) {
        self.schema_version = v;
    }

    pub fn get_schema_version(&self) -> u64 {
        self.schema_version
    }

    fn get_schema_version_for_reflect(&self) -> &u64 {
        &self.schema_version
    }

    fn mut_schema_version_for_reflect(&mut self) -> &mut u64 {
        &mut self.schema_version
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

    // string miner = 6;

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

    // float difficulty = 7;

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

    // uint64 timestamp = 8;

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

    // string merkle_root = 9;

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

    // string chain_root = 10;

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

    // uint64 distance = 11;

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

    // string nonce = 12;

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

    // uint64 nrg_grant = 13;

    pub fn clear_nrg_grant(&mut self) {
        self.nrg_grant = 0;
    }

    // Param is passed by value, moved
    pub fn set_nrg_grant(&mut self, v: u64) {
        self.nrg_grant = v;
    }

    pub fn get_nrg_grant(&self) -> u64 {
        self.nrg_grant
    }

    fn get_nrg_grant_for_reflect(&self) -> &u64 {
        &self.nrg_grant
    }

    fn mut_nrg_grant_for_reflect(&mut self) -> &mut u64 {
        &mut self.nrg_grant
    }

    // string target_hash = 14;

    pub fn clear_target_hash(&mut self) {
        self.target_hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_target_hash(&mut self, v: ::std::string::String) {
        self.target_hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_target_hash(&mut self) -> &mut ::std::string::String {
        &mut self.target_hash
    }

    // Take field
    pub fn take_target_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.target_hash, ::std::string::String::new())
    }

    pub fn get_target_hash(&self) -> &str {
        &self.target_hash
    }

    fn get_target_hash_for_reflect(&self) -> &::std::string::String {
        &self.target_hash
    }

    fn mut_target_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.target_hash
    }

    // uint64 target_height = 15;

    pub fn clear_target_height(&mut self) {
        self.target_height = 0;
    }

    // Param is passed by value, moved
    pub fn set_target_height(&mut self, v: u64) {
        self.target_height = v;
    }

    pub fn get_target_height(&self) -> u64 {
        self.target_height
    }

    fn get_target_height_for_reflect(&self) -> &u64 {
        &self.target_height
    }

    fn mut_target_height_for_reflect(&mut self) -> &mut u64 {
        &mut self.target_height
    }

    // string target_miner = 16;

    pub fn clear_target_miner(&mut self) {
        self.target_miner.clear();
    }

    // Param is passed by value, moved
    pub fn set_target_miner(&mut self, v: ::std::string::String) {
        self.target_miner = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_target_miner(&mut self) -> &mut ::std::string::String {
        &mut self.target_miner
    }

    // Take field
    pub fn take_target_miner(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.target_miner, ::std::string::String::new())
    }

    pub fn get_target_miner(&self) -> &str {
        &self.target_miner
    }

    fn get_target_miner_for_reflect(&self) -> &::std::string::String {
        &self.target_miner
    }

    fn mut_target_miner_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.target_miner
    }

    // string target_signature = 17;

    pub fn clear_target_signature(&mut self) {
        self.target_signature.clear();
    }

    // Param is passed by value, moved
    pub fn set_target_signature(&mut self, v: ::std::string::String) {
        self.target_signature = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_target_signature(&mut self) -> &mut ::std::string::String {
        &mut self.target_signature
    }

    // Take field
    pub fn take_target_signature(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.target_signature, ::std::string::String::new())
    }

    pub fn get_target_signature(&self) -> &str {
        &self.target_signature
    }

    fn get_target_signature_for_reflect(&self) -> &::std::string::String {
        &self.target_signature
    }

    fn mut_target_signature_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.target_signature
    }

    // uint64 twn = 18;

    pub fn clear_twn(&mut self) {
        self.twn = 0;
    }

    // Param is passed by value, moved
    pub fn set_twn(&mut self, v: u64) {
        self.twn = v;
    }

    pub fn get_twn(&self) -> u64 {
        self.twn
    }

    fn get_twn_for_reflect(&self) -> &u64 {
        &self.twn
    }

    fn mut_twn_for_reflect(&mut self) -> &mut u64 {
        &mut self.twn
    }

    // repeated string tws = 19;

    pub fn clear_tws(&mut self) {
        self.tws.clear();
    }

    // Param is passed by value, moved
    pub fn set_tws(&mut self, v: ::protobuf::RepeatedField<::std::string::String>) {
        self.tws = v;
    }

    // Mutable pointer to the field.
    pub fn mut_tws(&mut self) -> &mut ::protobuf::RepeatedField<::std::string::String> {
        &mut self.tws
    }

    // Take field
    pub fn take_tws(&mut self) -> ::protobuf::RepeatedField<::std::string::String> {
        ::std::mem::replace(&mut self.tws, ::protobuf::RepeatedField::new())
    }

    pub fn get_tws(&self) -> &[::std::string::String] {
        &self.tws
    }

    fn get_tws_for_reflect(&self) -> &::protobuf::RepeatedField<::std::string::String> {
        &self.tws
    }

    fn mut_tws_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<::std::string::String> {
        &mut self.tws
    }

    // uint64 emblem_weight = 20;

    pub fn clear_emblem_weight(&mut self) {
        self.emblem_weight = 0;
    }

    // Param is passed by value, moved
    pub fn set_emblem_weight(&mut self, v: u64) {
        self.emblem_weight = v;
    }

    pub fn get_emblem_weight(&self) -> u64 {
        self.emblem_weight
    }

    fn get_emblem_weight_for_reflect(&self) -> &u64 {
        &self.emblem_weight
    }

    fn mut_emblem_weight_for_reflect(&mut self) -> &mut u64 {
        &mut self.emblem_weight
    }

    // string emblem_chain_block_hash = 21;

    pub fn clear_emblem_chain_block_hash(&mut self) {
        self.emblem_chain_block_hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_emblem_chain_block_hash(&mut self, v: ::std::string::String) {
        self.emblem_chain_block_hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_emblem_chain_block_hash(&mut self) -> &mut ::std::string::String {
        &mut self.emblem_chain_block_hash
    }

    // Take field
    pub fn take_emblem_chain_block_hash(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.emblem_chain_block_hash, ::std::string::String::new())
    }

    pub fn get_emblem_chain_block_hash(&self) -> &str {
        &self.emblem_chain_block_hash
    }

    fn get_emblem_chain_block_hash_for_reflect(&self) -> &::std::string::String {
        &self.emblem_chain_block_hash
    }

    fn mut_emblem_chain_block_hash_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.emblem_chain_block_hash
    }

    // string emblem_chain_fingerprint_root = 22;

    pub fn clear_emblem_chain_fingerprint_root(&mut self) {
        self.emblem_chain_fingerprint_root.clear();
    }

    // Param is passed by value, moved
    pub fn set_emblem_chain_fingerprint_root(&mut self, v: ::std::string::String) {
        self.emblem_chain_fingerprint_root = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_emblem_chain_fingerprint_root(&mut self) -> &mut ::std::string::String {
        &mut self.emblem_chain_fingerprint_root
    }

    // Take field
    pub fn take_emblem_chain_fingerprint_root(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.emblem_chain_fingerprint_root, ::std::string::String::new())
    }

    pub fn get_emblem_chain_fingerprint_root(&self) -> &str {
        &self.emblem_chain_fingerprint_root
    }

    fn get_emblem_chain_fingerprint_root_for_reflect(&self) -> &::std::string::String {
        &self.emblem_chain_fingerprint_root
    }

    fn mut_emblem_chain_fingerprint_root_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.emblem_chain_fingerprint_root
    }

    // string emblem_chain_address = 23;

    pub fn clear_emblem_chain_address(&mut self) {
        self.emblem_chain_address.clear();
    }

    // Param is passed by value, moved
    pub fn set_emblem_chain_address(&mut self, v: ::std::string::String) {
        self.emblem_chain_address = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_emblem_chain_address(&mut self) -> &mut ::std::string::String {
        &mut self.emblem_chain_address
    }

    // Take field
    pub fn take_emblem_chain_address(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.emblem_chain_address, ::std::string::String::new())
    }

    pub fn get_emblem_chain_address(&self) -> &str {
        &self.emblem_chain_address
    }

    fn get_emblem_chain_address_for_reflect(&self) -> &::std::string::String {
        &self.emblem_chain_address
    }

    fn mut_emblem_chain_address_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.emblem_chain_address
    }

    // uint64 tx_count = 24;

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

    // repeated .bc.BcTransaction txs = 25;

    pub fn clear_txs(&mut self) {
        self.txs.clear();
    }

    // Param is passed by value, moved
    pub fn set_txs(&mut self, v: ::protobuf::RepeatedField<BcTransaction>) {
        self.txs = v;
    }

    // Mutable pointer to the field.
    pub fn mut_txs(&mut self) -> &mut ::protobuf::RepeatedField<BcTransaction> {
        &mut self.txs
    }

    // Take field
    pub fn take_txs(&mut self) -> ::protobuf::RepeatedField<BcTransaction> {
        ::std::mem::replace(&mut self.txs, ::protobuf::RepeatedField::new())
    }

    pub fn get_txs(&self) -> &[BcTransaction] {
        &self.txs
    }

    fn get_txs_for_reflect(&self) -> &::protobuf::RepeatedField<BcTransaction> {
        &self.txs
    }

    fn mut_txs_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BcTransaction> {
        &mut self.txs
    }

    // uint64 tx_fee_base = 26;

    pub fn clear_tx_fee_base(&mut self) {
        self.tx_fee_base = 0;
    }

    // Param is passed by value, moved
    pub fn set_tx_fee_base(&mut self, v: u64) {
        self.tx_fee_base = v;
    }

    pub fn get_tx_fee_base(&self) -> u64 {
        self.tx_fee_base
    }

    fn get_tx_fee_base_for_reflect(&self) -> &u64 {
        &self.tx_fee_base
    }

    fn mut_tx_fee_base_for_reflect(&mut self) -> &mut u64 {
        &mut self.tx_fee_base
    }

    // uint64 tx_distance_sum_limit = 27;

    pub fn clear_tx_distance_sum_limit(&mut self) {
        self.tx_distance_sum_limit = 0;
    }

    // Param is passed by value, moved
    pub fn set_tx_distance_sum_limit(&mut self, v: u64) {
        self.tx_distance_sum_limit = v;
    }

    pub fn get_tx_distance_sum_limit(&self) -> u64 {
        self.tx_distance_sum_limit
    }

    fn get_tx_distance_sum_limit_for_reflect(&self) -> &u64 {
        &self.tx_distance_sum_limit
    }

    fn mut_tx_distance_sum_limit_for_reflect(&mut self) -> &mut u64 {
        &mut self.tx_distance_sum_limit
    }

    // uint64 blockchain_headers_count = 28;

    pub fn clear_blockchain_headers_count(&mut self) {
        self.blockchain_headers_count = 0;
    }

    // Param is passed by value, moved
    pub fn set_blockchain_headers_count(&mut self, v: u64) {
        self.blockchain_headers_count = v;
    }

    pub fn get_blockchain_headers_count(&self) -> u64 {
        self.blockchain_headers_count
    }

    fn get_blockchain_headers_count_for_reflect(&self) -> &u64 {
        &self.blockchain_headers_count
    }

    fn mut_blockchain_headers_count_for_reflect(&mut self) -> &mut u64 {
        &mut self.blockchain_headers_count
    }

    // .bc.BlockchainHeaders blockchain_headers = 29;

    pub fn clear_blockchain_headers(&mut self) {
        self.blockchain_headers.clear();
    }

    pub fn has_blockchain_headers(&self) -> bool {
        self.blockchain_headers.is_some()
    }

    // Param is passed by value, moved
    pub fn set_blockchain_headers(&mut self, v: BlockchainHeaders) {
        self.blockchain_headers = ::protobuf::SingularPtrField::some(v);
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_blockchain_headers(&mut self) -> &mut BlockchainHeaders {
        if self.blockchain_headers.is_none() {
            self.blockchain_headers.set_default();
        }
        self.blockchain_headers.as_mut().unwrap()
    }

    // Take field
    pub fn take_blockchain_headers(&mut self) -> BlockchainHeaders {
        self.blockchain_headers.take().unwrap_or_else(|| BlockchainHeaders::new())
    }

    pub fn get_blockchain_headers(&self) -> &BlockchainHeaders {
        self.blockchain_headers.as_ref().unwrap_or_else(|| BlockchainHeaders::default_instance())
    }

    fn get_blockchain_headers_for_reflect(&self) -> &::protobuf::SingularPtrField<BlockchainHeaders> {
        &self.blockchain_headers
    }

    fn mut_blockchain_headers_for_reflect(&mut self) -> &mut ::protobuf::SingularPtrField<BlockchainHeaders> {
        &mut self.blockchain_headers
    }

    // string blockchain_fingerprints_root = 30;

    pub fn clear_blockchain_fingerprints_root(&mut self) {
        self.blockchain_fingerprints_root.clear();
    }

    // Param is passed by value, moved
    pub fn set_blockchain_fingerprints_root(&mut self, v: ::std::string::String) {
        self.blockchain_fingerprints_root = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_blockchain_fingerprints_root(&mut self) -> &mut ::std::string::String {
        &mut self.blockchain_fingerprints_root
    }

    // Take field
    pub fn take_blockchain_fingerprints_root(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.blockchain_fingerprints_root, ::std::string::String::new())
    }

    pub fn get_blockchain_fingerprints_root(&self) -> &str {
        &self.blockchain_fingerprints_root
    }

    fn get_blockchain_fingerprints_root_for_reflect(&self) -> &::std::string::String {
        &self.blockchain_fingerprints_root
    }

    fn mut_blockchain_fingerprints_root_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.blockchain_fingerprints_root
    }
}

impl ::protobuf::Message for BcBlock {
    fn is_initialized(&self) -> bool {
        for v in &self.txs {
            if !v.is_initialized() {
                return false;
            }
        };
        for v in &self.blockchain_headers {
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
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.previous_hash)?;
                },
                3 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.version = tmp;
                },
                4 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.schema_version = tmp;
                },
                5 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.height = tmp;
                },
                6 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.miner)?;
                },
                7 => {
                    if wire_type != ::protobuf::wire_format::WireTypeFixed32 {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_float()?;
                    self.difficulty = tmp;
                },
                8 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.timestamp = tmp;
                },
                9 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.merkle_root)?;
                },
                10 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.chain_root)?;
                },
                11 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.distance = tmp;
                },
                12 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.nonce)?;
                },
                13 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.nrg_grant = tmp;
                },
                14 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.target_hash)?;
                },
                15 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.target_height = tmp;
                },
                16 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.target_miner)?;
                },
                17 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.target_signature)?;
                },
                18 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.twn = tmp;
                },
                19 => {
                    ::protobuf::rt::read_repeated_string_into(wire_type, is, &mut self.tws)?;
                },
                20 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.emblem_weight = tmp;
                },
                21 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.emblem_chain_block_hash)?;
                },
                22 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.emblem_chain_fingerprint_root)?;
                },
                23 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.emblem_chain_address)?;
                },
                24 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.tx_count = tmp;
                },
                25 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.txs)?;
                },
                26 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.tx_fee_base = tmp;
                },
                27 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.tx_distance_sum_limit = tmp;
                },
                28 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.blockchain_headers_count = tmp;
                },
                29 => {
                    ::protobuf::rt::read_singular_message_into(wire_type, is, &mut self.blockchain_headers)?;
                },
                30 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.blockchain_fingerprints_root)?;
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
        if !self.previous_hash.is_empty() {
            my_size += ::protobuf::rt::string_size(2, &self.previous_hash);
        }
        if self.version != 0 {
            my_size += ::protobuf::rt::value_size(3, self.version, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.schema_version != 0 {
            my_size += ::protobuf::rt::value_size(4, self.schema_version, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.height != 0 {
            my_size += ::protobuf::rt::value_size(5, self.height, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.miner.is_empty() {
            my_size += ::protobuf::rt::string_size(6, &self.miner);
        }
        if self.difficulty != 0. {
            my_size += 5;
        }
        if self.timestamp != 0 {
            my_size += ::protobuf::rt::value_size(8, self.timestamp, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.merkle_root.is_empty() {
            my_size += ::protobuf::rt::string_size(9, &self.merkle_root);
        }
        if !self.chain_root.is_empty() {
            my_size += ::protobuf::rt::string_size(10, &self.chain_root);
        }
        if self.distance != 0 {
            my_size += ::protobuf::rt::value_size(11, self.distance, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.nonce.is_empty() {
            my_size += ::protobuf::rt::string_size(12, &self.nonce);
        }
        if self.nrg_grant != 0 {
            my_size += ::protobuf::rt::value_size(13, self.nrg_grant, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.target_hash.is_empty() {
            my_size += ::protobuf::rt::string_size(14, &self.target_hash);
        }
        if self.target_height != 0 {
            my_size += ::protobuf::rt::value_size(15, self.target_height, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.target_miner.is_empty() {
            my_size += ::protobuf::rt::string_size(16, &self.target_miner);
        }
        if !self.target_signature.is_empty() {
            my_size += ::protobuf::rt::string_size(17, &self.target_signature);
        }
        if self.twn != 0 {
            my_size += ::protobuf::rt::value_size(18, self.twn, ::protobuf::wire_format::WireTypeVarint);
        }
        for value in &self.tws {
            my_size += ::protobuf::rt::string_size(19, &value);
        };
        if self.emblem_weight != 0 {
            my_size += ::protobuf::rt::value_size(20, self.emblem_weight, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.emblem_chain_block_hash.is_empty() {
            my_size += ::protobuf::rt::string_size(21, &self.emblem_chain_block_hash);
        }
        if !self.emblem_chain_fingerprint_root.is_empty() {
            my_size += ::protobuf::rt::string_size(22, &self.emblem_chain_fingerprint_root);
        }
        if !self.emblem_chain_address.is_empty() {
            my_size += ::protobuf::rt::string_size(23, &self.emblem_chain_address);
        }
        if self.tx_count != 0 {
            my_size += ::protobuf::rt::value_size(24, self.tx_count, ::protobuf::wire_format::WireTypeVarint);
        }
        for value in &self.txs {
            let len = value.compute_size();
            my_size += 2 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        if self.tx_fee_base != 0 {
            my_size += ::protobuf::rt::value_size(26, self.tx_fee_base, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.tx_distance_sum_limit != 0 {
            my_size += ::protobuf::rt::value_size(27, self.tx_distance_sum_limit, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.blockchain_headers_count != 0 {
            my_size += ::protobuf::rt::value_size(28, self.blockchain_headers_count, ::protobuf::wire_format::WireTypeVarint);
        }
        if let Some(ref v) = self.blockchain_headers.as_ref() {
            let len = v.compute_size();
            my_size += 2 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        }
        if !self.blockchain_fingerprints_root.is_empty() {
            my_size += ::protobuf::rt::string_size(30, &self.blockchain_fingerprints_root);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.hash.is_empty() {
            os.write_string(1, &self.hash)?;
        }
        if !self.previous_hash.is_empty() {
            os.write_string(2, &self.previous_hash)?;
        }
        if self.version != 0 {
            os.write_uint64(3, self.version)?;
        }
        if self.schema_version != 0 {
            os.write_uint64(4, self.schema_version)?;
        }
        if self.height != 0 {
            os.write_uint64(5, self.height)?;
        }
        if !self.miner.is_empty() {
            os.write_string(6, &self.miner)?;
        }
        if self.difficulty != 0. {
            os.write_float(7, self.difficulty)?;
        }
        if self.timestamp != 0 {
            os.write_uint64(8, self.timestamp)?;
        }
        if !self.merkle_root.is_empty() {
            os.write_string(9, &self.merkle_root)?;
        }
        if !self.chain_root.is_empty() {
            os.write_string(10, &self.chain_root)?;
        }
        if self.distance != 0 {
            os.write_uint64(11, self.distance)?;
        }
        if !self.nonce.is_empty() {
            os.write_string(12, &self.nonce)?;
        }
        if self.nrg_grant != 0 {
            os.write_uint64(13, self.nrg_grant)?;
        }
        if !self.target_hash.is_empty() {
            os.write_string(14, &self.target_hash)?;
        }
        if self.target_height != 0 {
            os.write_uint64(15, self.target_height)?;
        }
        if !self.target_miner.is_empty() {
            os.write_string(16, &self.target_miner)?;
        }
        if !self.target_signature.is_empty() {
            os.write_string(17, &self.target_signature)?;
        }
        if self.twn != 0 {
            os.write_uint64(18, self.twn)?;
        }
        for v in &self.tws {
            os.write_string(19, &v)?;
        };
        if self.emblem_weight != 0 {
            os.write_uint64(20, self.emblem_weight)?;
        }
        if !self.emblem_chain_block_hash.is_empty() {
            os.write_string(21, &self.emblem_chain_block_hash)?;
        }
        if !self.emblem_chain_fingerprint_root.is_empty() {
            os.write_string(22, &self.emblem_chain_fingerprint_root)?;
        }
        if !self.emblem_chain_address.is_empty() {
            os.write_string(23, &self.emblem_chain_address)?;
        }
        if self.tx_count != 0 {
            os.write_uint64(24, self.tx_count)?;
        }
        for v in &self.txs {
            os.write_tag(25, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        };
        if self.tx_fee_base != 0 {
            os.write_uint64(26, self.tx_fee_base)?;
        }
        if self.tx_distance_sum_limit != 0 {
            os.write_uint64(27, self.tx_distance_sum_limit)?;
        }
        if self.blockchain_headers_count != 0 {
            os.write_uint64(28, self.blockchain_headers_count)?;
        }
        if let Some(ref v) = self.blockchain_headers.as_ref() {
            os.write_tag(29, ::protobuf::wire_format::WireTypeLengthDelimited)?;
            os.write_raw_varint32(v.get_cached_size())?;
            v.write_to_with_cached_sizes(os)?;
        }
        if !self.blockchain_fingerprints_root.is_empty() {
            os.write_string(30, &self.blockchain_fingerprints_root)?;
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
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "previous_hash",
                    BcBlock::get_previous_hash_for_reflect,
                    BcBlock::mut_previous_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "version",
                    BcBlock::get_version_for_reflect,
                    BcBlock::mut_version_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "schema_version",
                    BcBlock::get_schema_version_for_reflect,
                    BcBlock::mut_schema_version_for_reflect,
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
                    "nrg_grant",
                    BcBlock::get_nrg_grant_for_reflect,
                    BcBlock::mut_nrg_grant_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "target_hash",
                    BcBlock::get_target_hash_for_reflect,
                    BcBlock::mut_target_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "target_height",
                    BcBlock::get_target_height_for_reflect,
                    BcBlock::mut_target_height_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "target_miner",
                    BcBlock::get_target_miner_for_reflect,
                    BcBlock::mut_target_miner_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "target_signature",
                    BcBlock::get_target_signature_for_reflect,
                    BcBlock::mut_target_signature_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "twn",
                    BcBlock::get_twn_for_reflect,
                    BcBlock::mut_twn_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "tws",
                    BcBlock::get_tws_for_reflect,
                    BcBlock::mut_tws_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "emblem_weight",
                    BcBlock::get_emblem_weight_for_reflect,
                    BcBlock::mut_emblem_weight_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "emblem_chain_block_hash",
                    BcBlock::get_emblem_chain_block_hash_for_reflect,
                    BcBlock::mut_emblem_chain_block_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "emblem_chain_fingerprint_root",
                    BcBlock::get_emblem_chain_fingerprint_root_for_reflect,
                    BcBlock::mut_emblem_chain_fingerprint_root_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "emblem_chain_address",
                    BcBlock::get_emblem_chain_address_for_reflect,
                    BcBlock::mut_emblem_chain_address_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "tx_count",
                    BcBlock::get_tx_count_for_reflect,
                    BcBlock::mut_tx_count_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BcTransaction>>(
                    "txs",
                    BcBlock::get_txs_for_reflect,
                    BcBlock::mut_txs_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "tx_fee_base",
                    BcBlock::get_tx_fee_base_for_reflect,
                    BcBlock::mut_tx_fee_base_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "tx_distance_sum_limit",
                    BcBlock::get_tx_distance_sum_limit_for_reflect,
                    BcBlock::mut_tx_distance_sum_limit_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "blockchain_headers_count",
                    BcBlock::get_blockchain_headers_count_for_reflect,
                    BcBlock::mut_blockchain_headers_count_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_singular_ptr_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHeaders>>(
                    "blockchain_headers",
                    BcBlock::get_blockchain_headers_for_reflect,
                    BcBlock::mut_blockchain_headers_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "blockchain_fingerprints_root",
                    BcBlock::get_blockchain_fingerprints_root_for_reflect,
                    BcBlock::mut_blockchain_fingerprints_root_for_reflect,
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
        self.clear_previous_hash();
        self.clear_version();
        self.clear_schema_version();
        self.clear_height();
        self.clear_miner();
        self.clear_difficulty();
        self.clear_timestamp();
        self.clear_merkle_root();
        self.clear_chain_root();
        self.clear_distance();
        self.clear_nonce();
        self.clear_nrg_grant();
        self.clear_target_hash();
        self.clear_target_height();
        self.clear_target_miner();
        self.clear_target_signature();
        self.clear_twn();
        self.clear_tws();
        self.clear_emblem_weight();
        self.clear_emblem_chain_block_hash();
        self.clear_emblem_chain_fingerprint_root();
        self.clear_emblem_chain_address();
        self.clear_tx_count();
        self.clear_txs();
        self.clear_tx_fee_base();
        self.clear_tx_distance_sum_limit();
        self.clear_blockchain_headers_count();
        self.clear_blockchain_headers();
        self.clear_blockchain_fingerprints_root();
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
pub struct BlockchainHeader {
    // message fields
    pub blockchain: ::std::string::String,
    pub hash: ::std::string::String,
    pub previous_hash: ::std::string::String,
    pub timestamp: u64,
    pub height: u64,
    pub merkle_root: ::std::string::String,
    pub blockchain_confirmations_in_parent_count: u64,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BlockchainHeader {}

impl BlockchainHeader {
    pub fn new() -> BlockchainHeader {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BlockchainHeader {
        static mut instance: ::protobuf::lazy::Lazy<BlockchainHeader> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BlockchainHeader,
        };
        unsafe {
            instance.get(BlockchainHeader::new)
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

    // uint64 blockchain_confirmations_in_parent_count = 7;

    pub fn clear_blockchain_confirmations_in_parent_count(&mut self) {
        self.blockchain_confirmations_in_parent_count = 0;
    }

    // Param is passed by value, moved
    pub fn set_blockchain_confirmations_in_parent_count(&mut self, v: u64) {
        self.blockchain_confirmations_in_parent_count = v;
    }

    pub fn get_blockchain_confirmations_in_parent_count(&self) -> u64 {
        self.blockchain_confirmations_in_parent_count
    }

    fn get_blockchain_confirmations_in_parent_count_for_reflect(&self) -> &u64 {
        &self.blockchain_confirmations_in_parent_count
    }

    fn mut_blockchain_confirmations_in_parent_count_for_reflect(&mut self) -> &mut u64 {
        &mut self.blockchain_confirmations_in_parent_count
    }
}

impl ::protobuf::Message for BlockchainHeader {
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
                    self.blockchain_confirmations_in_parent_count = tmp;
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
        if self.blockchain_confirmations_in_parent_count != 0 {
            my_size += ::protobuf::rt::value_size(7, self.blockchain_confirmations_in_parent_count, ::protobuf::wire_format::WireTypeVarint);
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
        if self.blockchain_confirmations_in_parent_count != 0 {
            os.write_uint64(7, self.blockchain_confirmations_in_parent_count)?;
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

impl ::protobuf::MessageStatic for BlockchainHeader {
    fn new() -> BlockchainHeader {
        BlockchainHeader::new()
    }

    fn descriptor_static(_: ::std::option::Option<BlockchainHeader>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "blockchain",
                    BlockchainHeader::get_blockchain_for_reflect,
                    BlockchainHeader::mut_blockchain_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    BlockchainHeader::get_hash_for_reflect,
                    BlockchainHeader::mut_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "previous_hash",
                    BlockchainHeader::get_previous_hash_for_reflect,
                    BlockchainHeader::mut_previous_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "timestamp",
                    BlockchainHeader::get_timestamp_for_reflect,
                    BlockchainHeader::mut_timestamp_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "height",
                    BlockchainHeader::get_height_for_reflect,
                    BlockchainHeader::mut_height_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "merkle_root",
                    BlockchainHeader::get_merkle_root_for_reflect,
                    BlockchainHeader::mut_merkle_root_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "blockchain_confirmations_in_parent_count",
                    BlockchainHeader::get_blockchain_confirmations_in_parent_count_for_reflect,
                    BlockchainHeader::mut_blockchain_confirmations_in_parent_count_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BlockchainHeader>(
                    "BlockchainHeader",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BlockchainHeader {
    fn clear(&mut self) {
        self.clear_blockchain();
        self.clear_hash();
        self.clear_previous_hash();
        self.clear_timestamp();
        self.clear_height();
        self.clear_merkle_root();
        self.clear_blockchain_confirmations_in_parent_count();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BlockchainHeader {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BlockchainHeader {
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
    \x06\x20\x01(\tR\nmerkleRoot\"\xdb\x01\n\x11BlockchainHeaders\x12&\n\x03\
    btc\x18\x01\x20\x03(\x0b2\x14.bc.BlockchainHeaderR\x03btc\x12&\n\x03eth\
    \x18\x02\x20\x03(\x0b2\x14.bc.BlockchainHeaderR\x03eth\x12&\n\x03lsk\x18\
    \x03\x20\x03(\x0b2\x14.bc.BlockchainHeaderR\x03lsk\x12&\n\x03neo\x18\x04\
    \x20\x03(\x0b2\x14.bc.BlockchainHeaderR\x03neo\x12&\n\x03wav\x18\x05\x20\
    \x03(\x0b2\x14.bc.BlockchainHeaderR\x03wav\"\xdc\x08\n\x07BcBlock\x12\
    \x12\n\x04hash\x18\x01\x20\x01(\tR\x04hash\x12#\n\rprevious_hash\x18\x02\
    \x20\x01(\tR\x0cpreviousHash\x12\x18\n\x07version\x18\x03\x20\x01(\x04R\
    \x07version\x12%\n\x0eschema_version\x18\x04\x20\x01(\x04R\rschemaVersio\
    n\x12\x16\n\x06height\x18\x05\x20\x01(\x04R\x06height\x12\x14\n\x05miner\
    \x18\x06\x20\x01(\tR\x05miner\x12\x1e\n\ndifficulty\x18\x07\x20\x01(\x02\
    R\ndifficulty\x12\x1c\n\ttimestamp\x18\x08\x20\x01(\x04R\ttimestamp\x12\
    \x1f\n\x0bmerkle_root\x18\t\x20\x01(\tR\nmerkleRoot\x12\x1d\n\nchain_roo\
    t\x18\n\x20\x01(\tR\tchainRoot\x12\x1a\n\x08distance\x18\x0b\x20\x01(\
    \x04R\x08distance\x12\x14\n\x05nonce\x18\x0c\x20\x01(\tR\x05nonce\x12\
    \x1b\n\tnrg_grant\x18\r\x20\x01(\x04R\x08nrgGrant\x12\x1f\n\x0btarget_ha\
    sh\x18\x0e\x20\x01(\tR\ntargetHash\x12#\n\rtarget_height\x18\x0f\x20\x01\
    (\x04R\x0ctargetHeight\x12!\n\x0ctarget_miner\x18\x10\x20\x01(\tR\x0btar\
    getMiner\x12)\n\x10target_signature\x18\x11\x20\x01(\tR\x0ftargetSignatu\
    re\x12\x10\n\x03twn\x18\x12\x20\x01(\x04R\x03twn\x12\x10\n\x03tws\x18\
    \x13\x20\x03(\tR\x03tws\x12#\n\remblem_weight\x18\x14\x20\x01(\x04R\x0ce\
    mblemWeight\x125\n\x17emblem_chain_block_hash\x18\x15\x20\x01(\tR\x14emb\
    lemChainBlockHash\x12A\n\x1demblem_chain_fingerprint_root\x18\x16\x20\
    \x01(\tR\x1aemblemChainFingerprintRoot\x120\n\x14emblem_chain_address\
    \x18\x17\x20\x01(\tR\x12emblemChainAddress\x12\x19\n\x08tx_count\x18\x18\
    \x20\x01(\x04R\x07txCount\x12#\n\x03txs\x18\x19\x20\x03(\x0b2\x11.bc.BcT\
    ransactionR\x03txs\x12\x1e\n\x0btx_fee_base\x18\x1a\x20\x01(\x04R\ttxFee\
    Base\x121\n\x15tx_distance_sum_limit\x18\x1b\x20\x01(\x04R\x12txDistance\
    SumLimit\x128\n\x18blockchain_headers_count\x18\x1c\x20\x01(\x04R\x16blo\
    ckchainHeadersCount\x12D\n\x12blockchain_headers\x18\x1d\x20\x01(\x0b2\
    \x15.bc.BlockchainHeadersR\x11blockchainHeaders\x12@\n\x1cblockchain_fin\
    gerprints_root\x18\x1e\x20\x01(\tR\x1ablockchainFingerprintsRoot\"#\n\rB\
    cTransaction\x12\x12\n\x04hash\x18\x01\x20\x01(\tR\x04hash\"\x9a\x02\n\
    \x10BlockchainHeader\x12\x1e\n\nblockchain\x18\x01\x20\x01(\tR\nblockcha\
    in\x12\x12\n\x04hash\x18\x02\x20\x01(\tR\x04hash\x12#\n\rprevious_hash\
    \x18\x03\x20\x01(\tR\x0cpreviousHash\x12\x1c\n\ttimestamp\x18\x04\x20\
    \x01(\x04R\ttimestamp\x12\x16\n\x06height\x18\x05\x20\x01(\x04R\x06heigh\
    t\x12\x1f\n\x0bmerkle_root\x18\x06\x20\x01(\tR\nmerkleRoot\x12V\n(blockc\
    hain_confirmations_in_parent_count\x18\x07\x20\x01(\x04R$blockchainConfi\
    rmationsInParentCountb\x06proto3\
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
