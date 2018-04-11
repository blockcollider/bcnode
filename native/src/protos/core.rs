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

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\ncore.proto\x12\x02bc\"\x06\n\x04Null\"`\n\x05Block\x12\x1e\n\nblockc\
    hain\x18\x01\x20\x01(\tR\nblockchain\x12\x12\n\x04hash\x18\x02\x20\x01(\
    \tR\x04hash\x12#\n\rprevious_hash\x18\x03\x20\x01(\tR\x0cpreviousHashb\
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
