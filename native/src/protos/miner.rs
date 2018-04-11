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
pub struct BlockchainHash {
    // message fields
    pub blockchain: ::std::string::String,
    pub hash: ::std::string::String,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BlockchainHash {}

impl BlockchainHash {
    pub fn new() -> BlockchainHash {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BlockchainHash {
        static mut instance: ::protobuf::lazy::Lazy<BlockchainHash> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BlockchainHash,
        };
        unsafe {
            instance.get(BlockchainHash::new)
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
}

impl ::protobuf::Message for BlockchainHash {
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

impl ::protobuf::MessageStatic for BlockchainHash {
    fn new() -> BlockchainHash {
        BlockchainHash::new()
    }

    fn descriptor_static(_: ::std::option::Option<BlockchainHash>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "blockchain",
                    BlockchainHash::get_blockchain_for_reflect,
                    BlockchainHash::mut_blockchain_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    BlockchainHash::get_hash_for_reflect,
                    BlockchainHash::mut_hash_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BlockchainHash>(
                    "BlockchainHash",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BlockchainHash {
    fn clear(&mut self) {
        self.clear_blockchain();
        self.clear_hash();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BlockchainHash {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BlockchainHash {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct BlockIn {
    // message fields
    pub threshold: f32,
    pub hashes: ::protobuf::RepeatedField<BlockchainHash>,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BlockIn {}

impl BlockIn {
    pub fn new() -> BlockIn {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BlockIn {
        static mut instance: ::protobuf::lazy::Lazy<BlockIn> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BlockIn,
        };
        unsafe {
            instance.get(BlockIn::new)
        }
    }

    // float threshold = 1;

    pub fn clear_threshold(&mut self) {
        self.threshold = 0.;
    }

    // Param is passed by value, moved
    pub fn set_threshold(&mut self, v: f32) {
        self.threshold = v;
    }

    pub fn get_threshold(&self) -> f32 {
        self.threshold
    }

    fn get_threshold_for_reflect(&self) -> &f32 {
        &self.threshold
    }

    fn mut_threshold_for_reflect(&mut self) -> &mut f32 {
        &mut self.threshold
    }

    // repeated .bc.BlockchainHash hashes = 2;

    pub fn clear_hashes(&mut self) {
        self.hashes.clear();
    }

    // Param is passed by value, moved
    pub fn set_hashes(&mut self, v: ::protobuf::RepeatedField<BlockchainHash>) {
        self.hashes = v;
    }

    // Mutable pointer to the field.
    pub fn mut_hashes(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHash> {
        &mut self.hashes
    }

    // Take field
    pub fn take_hashes(&mut self) -> ::protobuf::RepeatedField<BlockchainHash> {
        ::std::mem::replace(&mut self.hashes, ::protobuf::RepeatedField::new())
    }

    pub fn get_hashes(&self) -> &[BlockchainHash] {
        &self.hashes
    }

    fn get_hashes_for_reflect(&self) -> &::protobuf::RepeatedField<BlockchainHash> {
        &self.hashes
    }

    fn mut_hashes_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockchainHash> {
        &mut self.hashes
    }
}

impl ::protobuf::Message for BlockIn {
    fn is_initialized(&self) -> bool {
        for v in &self.hashes {
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
                    if wire_type != ::protobuf::wire_format::WireTypeFixed32 {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_float()?;
                    self.threshold = tmp;
                },
                2 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.hashes)?;
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
        if self.threshold != 0. {
            my_size += 5;
        }
        for value in &self.hashes {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if self.threshold != 0. {
            os.write_float(1, self.threshold)?;
        }
        for v in &self.hashes {
            os.write_tag(2, ::protobuf::wire_format::WireTypeLengthDelimited)?;
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

impl ::protobuf::MessageStatic for BlockIn {
    fn new() -> BlockIn {
        BlockIn::new()
    }

    fn descriptor_static(_: ::std::option::Option<BlockIn>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeFloat>(
                    "threshold",
                    BlockIn::get_threshold_for_reflect,
                    BlockIn::mut_threshold_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockchainHash>>(
                    "hashes",
                    BlockIn::get_hashes_for_reflect,
                    BlockIn::mut_hashes_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BlockIn>(
                    "BlockIn",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BlockIn {
    fn clear(&mut self) {
        self.clear_threshold();
        self.clear_hashes();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BlockIn {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BlockIn {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct BlockOut {
    // message fields
    pub nonce: ::std::string::String,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BlockOut {}

impl BlockOut {
    pub fn new() -> BlockOut {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BlockOut {
        static mut instance: ::protobuf::lazy::Lazy<BlockOut> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BlockOut,
        };
        unsafe {
            instance.get(BlockOut::new)
        }
    }

    // string nonce = 1;

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
}

impl ::protobuf::Message for BlockOut {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.nonce)?;
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
        if !self.nonce.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.nonce);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.nonce.is_empty() {
            os.write_string(1, &self.nonce)?;
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

impl ::protobuf::MessageStatic for BlockOut {
    fn new() -> BlockOut {
        BlockOut::new()
    }

    fn descriptor_static(_: ::std::option::Option<BlockOut>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "nonce",
                    BlockOut::get_nonce_for_reflect,
                    BlockOut::mut_nonce_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BlockOut>(
                    "BlockOut",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BlockOut {
    fn clear(&mut self) {
        self.clear_nonce();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BlockOut {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BlockOut {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\x0bminer.proto\x12\x02bc\"D\n\x0eBlockchainHash\x12\x1e\n\nblockchain\
    \x18\x01\x20\x01(\tR\nblockchain\x12\x12\n\x04hash\x18\x02\x20\x01(\tR\
    \x04hash\"S\n\x07BlockIn\x12\x1c\n\tthreshold\x18\x01\x20\x01(\x02R\tthr\
    eshold\x12*\n\x06hashes\x18\x02\x20\x03(\x0b2\x12.bc.BlockchainHashR\x06\
    hashes\"\x20\n\x08BlockOut\x12\x14\n\x05nonce\x18\x01\x20\x01(\tR\x05non\
    ceb\x06proto3\
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
