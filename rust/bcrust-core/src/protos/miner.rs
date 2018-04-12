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
pub struct BlockFingerprint {
    // message fields
    pub blockchain: ::std::string::String,
    pub hash: ::std::string::String,
    pub timestamp: u64,
    pub is_current: bool,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for BlockFingerprint {}

impl BlockFingerprint {
    pub fn new() -> BlockFingerprint {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static BlockFingerprint {
        static mut instance: ::protobuf::lazy::Lazy<BlockFingerprint> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const BlockFingerprint,
        };
        unsafe {
            instance.get(BlockFingerprint::new)
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

    // uint64 timestamp = 3;

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

    // bool is_current = 4;

    pub fn clear_is_current(&mut self) {
        self.is_current = false;
    }

    // Param is passed by value, moved
    pub fn set_is_current(&mut self, v: bool) {
        self.is_current = v;
    }

    pub fn get_is_current(&self) -> bool {
        self.is_current
    }

    fn get_is_current_for_reflect(&self) -> &bool {
        &self.is_current
    }

    fn mut_is_current_for_reflect(&mut self) -> &mut bool {
        &mut self.is_current
    }
}

impl ::protobuf::Message for BlockFingerprint {
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
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint64()?;
                    self.timestamp = tmp;
                },
                4 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_bool()?;
                    self.is_current = tmp;
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
        if self.timestamp != 0 {
            my_size += ::protobuf::rt::value_size(3, self.timestamp, ::protobuf::wire_format::WireTypeVarint);
        }
        if self.is_current != false {
            my_size += 2;
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
        if self.timestamp != 0 {
            os.write_uint64(3, self.timestamp)?;
        }
        if self.is_current != false {
            os.write_bool(4, self.is_current)?;
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

impl ::protobuf::MessageStatic for BlockFingerprint {
    fn new() -> BlockFingerprint {
        BlockFingerprint::new()
    }

    fn descriptor_static(_: ::std::option::Option<BlockFingerprint>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "blockchain",
                    BlockFingerprint::get_blockchain_for_reflect,
                    BlockFingerprint::mut_blockchain_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "hash",
                    BlockFingerprint::get_hash_for_reflect,
                    BlockFingerprint::mut_hash_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint64>(
                    "timestamp",
                    BlockFingerprint::get_timestamp_for_reflect,
                    BlockFingerprint::mut_timestamp_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeBool>(
                    "is_current",
                    BlockFingerprint::get_is_current_for_reflect,
                    BlockFingerprint::mut_is_current_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<BlockFingerprint>(
                    "BlockFingerprint",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for BlockFingerprint {
    fn clear(&mut self) {
        self.clear_blockchain();
        self.clear_hash();
        self.clear_timestamp();
        self.clear_is_current();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for BlockFingerprint {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for BlockFingerprint {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct MinerRequest {
    // message fields
    pub merkle_root: ::std::string::String,
    pub fingerprints: ::protobuf::RepeatedField<BlockFingerprint>,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for MinerRequest {}

impl MinerRequest {
    pub fn new() -> MinerRequest {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static MinerRequest {
        static mut instance: ::protobuf::lazy::Lazy<MinerRequest> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const MinerRequest,
        };
        unsafe {
            instance.get(MinerRequest::new)
        }
    }

    // string merkle_root = 1;

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

    // repeated .bc.BlockFingerprint fingerprints = 2;

    pub fn clear_fingerprints(&mut self) {
        self.fingerprints.clear();
    }

    // Param is passed by value, moved
    pub fn set_fingerprints(&mut self, v: ::protobuf::RepeatedField<BlockFingerprint>) {
        self.fingerprints = v;
    }

    // Mutable pointer to the field.
    pub fn mut_fingerprints(&mut self) -> &mut ::protobuf::RepeatedField<BlockFingerprint> {
        &mut self.fingerprints
    }

    // Take field
    pub fn take_fingerprints(&mut self) -> ::protobuf::RepeatedField<BlockFingerprint> {
        ::std::mem::replace(&mut self.fingerprints, ::protobuf::RepeatedField::new())
    }

    pub fn get_fingerprints(&self) -> &[BlockFingerprint] {
        &self.fingerprints
    }

    fn get_fingerprints_for_reflect(&self) -> &::protobuf::RepeatedField<BlockFingerprint> {
        &self.fingerprints
    }

    fn mut_fingerprints_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<BlockFingerprint> {
        &mut self.fingerprints
    }
}

impl ::protobuf::Message for MinerRequest {
    fn is_initialized(&self) -> bool {
        for v in &self.fingerprints {
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
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.merkle_root)?;
                },
                2 => {
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.fingerprints)?;
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
        if !self.merkle_root.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.merkle_root);
        }
        for value in &self.fingerprints {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.merkle_root.is_empty() {
            os.write_string(1, &self.merkle_root)?;
        }
        for v in &self.fingerprints {
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

impl ::protobuf::MessageStatic for MinerRequest {
    fn new() -> MinerRequest {
        MinerRequest::new()
    }

    fn descriptor_static(_: ::std::option::Option<MinerRequest>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "merkle_root",
                    MinerRequest::get_merkle_root_for_reflect,
                    MinerRequest::mut_merkle_root_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<BlockFingerprint>>(
                    "fingerprints",
                    MinerRequest::get_fingerprints_for_reflect,
                    MinerRequest::mut_fingerprints_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<MinerRequest>(
                    "MinerRequest",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for MinerRequest {
    fn clear(&mut self) {
        self.clear_merkle_root();
        self.clear_fingerprints();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for MinerRequest {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for MinerRequest {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct MinerResponse {
    // message fields
    pub nonce: ::std::string::String,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for MinerResponse {}

impl MinerResponse {
    pub fn new() -> MinerResponse {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static MinerResponse {
        static mut instance: ::protobuf::lazy::Lazy<MinerResponse> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const MinerResponse,
        };
        unsafe {
            instance.get(MinerResponse::new)
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

impl ::protobuf::Message for MinerResponse {
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

impl ::protobuf::MessageStatic for MinerResponse {
    fn new() -> MinerResponse {
        MinerResponse::new()
    }

    fn descriptor_static(_: ::std::option::Option<MinerResponse>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "nonce",
                    MinerResponse::get_nonce_for_reflect,
                    MinerResponse::mut_nonce_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<MinerResponse>(
                    "MinerResponse",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for MinerResponse {
    fn clear(&mut self) {
        self.clear_nonce();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for MinerResponse {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for MinerResponse {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\x0bminer.proto\x12\x02bc\"\x83\x01\n\x10BlockFingerprint\x12\x1e\n\nb\
    lockchain\x18\x01\x20\x01(\tR\nblockchain\x12\x12\n\x04hash\x18\x02\x20\
    \x01(\tR\x04hash\x12\x1c\n\ttimestamp\x18\x03\x20\x01(\x04R\ttimestamp\
    \x12\x1d\n\nis_current\x18\x04\x20\x01(\x08R\tisCurrent\"i\n\x0cMinerReq\
    uest\x12\x1f\n\x0bmerkle_root\x18\x01\x20\x01(\tR\nmerkleRoot\x128\n\x0c\
    fingerprints\x18\x02\x20\x03(\x0b2\x14.bc.BlockFingerprintR\x0cfingerpri\
    nts\"%\n\rMinerResponse\x12\x14\n\x05nonce\x18\x01\x20\x01(\tR\x05nonceb\
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
