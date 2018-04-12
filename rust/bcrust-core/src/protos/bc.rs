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
pub struct GetLatestBlocksResponse {
    // message fields
    pub blocks: ::protobuf::RepeatedField<super::core::Block>,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for GetLatestBlocksResponse {}

impl GetLatestBlocksResponse {
    pub fn new() -> GetLatestBlocksResponse {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static GetLatestBlocksResponse {
        static mut instance: ::protobuf::lazy::Lazy<GetLatestBlocksResponse> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const GetLatestBlocksResponse,
        };
        unsafe {
            instance.get(GetLatestBlocksResponse::new)
        }
    }

    // repeated .bc.Block blocks = 1;

    pub fn clear_blocks(&mut self) {
        self.blocks.clear();
    }

    // Param is passed by value, moved
    pub fn set_blocks(&mut self, v: ::protobuf::RepeatedField<super::core::Block>) {
        self.blocks = v;
    }

    // Mutable pointer to the field.
    pub fn mut_blocks(&mut self) -> &mut ::protobuf::RepeatedField<super::core::Block> {
        &mut self.blocks
    }

    // Take field
    pub fn take_blocks(&mut self) -> ::protobuf::RepeatedField<super::core::Block> {
        ::std::mem::replace(&mut self.blocks, ::protobuf::RepeatedField::new())
    }

    pub fn get_blocks(&self) -> &[super::core::Block] {
        &self.blocks
    }

    fn get_blocks_for_reflect(&self) -> &::protobuf::RepeatedField<super::core::Block> {
        &self.blocks
    }

    fn mut_blocks_for_reflect(&mut self) -> &mut ::protobuf::RepeatedField<super::core::Block> {
        &mut self.blocks
    }
}

impl ::protobuf::Message for GetLatestBlocksResponse {
    fn is_initialized(&self) -> bool {
        for v in &self.blocks {
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
                    ::protobuf::rt::read_repeated_message_into(wire_type, is, &mut self.blocks)?;
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
        for value in &self.blocks {
            let len = value.compute_size();
            my_size += 1 + ::protobuf::rt::compute_raw_varint32_size(len) + len;
        };
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        for v in &self.blocks {
            os.write_tag(1, ::protobuf::wire_format::WireTypeLengthDelimited)?;
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

impl ::protobuf::MessageStatic for GetLatestBlocksResponse {
    fn new() -> GetLatestBlocksResponse {
        GetLatestBlocksResponse::new()
    }

    fn descriptor_static(_: ::std::option::Option<GetLatestBlocksResponse>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_repeated_field_accessor::<_, ::protobuf::types::ProtobufTypeMessage<super::core::Block>>(
                    "blocks",
                    GetLatestBlocksResponse::get_blocks_for_reflect,
                    GetLatestBlocksResponse::mut_blocks_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<GetLatestBlocksResponse>(
                    "GetLatestBlocksResponse",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for GetLatestBlocksResponse {
    fn clear(&mut self) {
        self.clear_blocks();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for GetLatestBlocksResponse {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for GetLatestBlocksResponse {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct HelpResponse {
    // message fields
    pub help_text: ::std::string::String,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for HelpResponse {}

impl HelpResponse {
    pub fn new() -> HelpResponse {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static HelpResponse {
        static mut instance: ::protobuf::lazy::Lazy<HelpResponse> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const HelpResponse,
        };
        unsafe {
            instance.get(HelpResponse::new)
        }
    }

    // string help_text = 1;

    pub fn clear_help_text(&mut self) {
        self.help_text.clear();
    }

    // Param is passed by value, moved
    pub fn set_help_text(&mut self, v: ::std::string::String) {
        self.help_text = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_help_text(&mut self) -> &mut ::std::string::String {
        &mut self.help_text
    }

    // Take field
    pub fn take_help_text(&mut self) -> ::std::string::String {
        ::std::mem::replace(&mut self.help_text, ::std::string::String::new())
    }

    pub fn get_help_text(&self) -> &str {
        &self.help_text
    }

    fn get_help_text_for_reflect(&self) -> &::std::string::String {
        &self.help_text
    }

    fn mut_help_text_for_reflect(&mut self) -> &mut ::std::string::String {
        &mut self.help_text
    }
}

impl ::protobuf::Message for HelpResponse {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_string_into(wire_type, is, &mut self.help_text)?;
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
        if !self.help_text.is_empty() {
            my_size += ::protobuf::rt::string_size(1, &self.help_text);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if !self.help_text.is_empty() {
            os.write_string(1, &self.help_text)?;
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

impl ::protobuf::MessageStatic for HelpResponse {
    fn new() -> HelpResponse {
        HelpResponse::new()
    }

    fn descriptor_static(_: ::std::option::Option<HelpResponse>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeString>(
                    "help_text",
                    HelpResponse::get_help_text_for_reflect,
                    HelpResponse::mut_help_text_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<HelpResponse>(
                    "HelpResponse",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for HelpResponse {
    fn clear(&mut self) {
        self.clear_help_text();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for HelpResponse {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for HelpResponse {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct StatsResponse {
    // message fields
    pub calls: i64,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for StatsResponse {}

impl StatsResponse {
    pub fn new() -> StatsResponse {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static StatsResponse {
        static mut instance: ::protobuf::lazy::Lazy<StatsResponse> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const StatsResponse,
        };
        unsafe {
            instance.get(StatsResponse::new)
        }
    }

    // int64 calls = 1;

    pub fn clear_calls(&mut self) {
        self.calls = 0;
    }

    // Param is passed by value, moved
    pub fn set_calls(&mut self, v: i64) {
        self.calls = v;
    }

    pub fn get_calls(&self) -> i64 {
        self.calls
    }

    fn get_calls_for_reflect(&self) -> &i64 {
        &self.calls
    }

    fn mut_calls_for_reflect(&mut self) -> &mut i64 {
        &mut self.calls
    }
}

impl ::protobuf::Message for StatsResponse {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_int64()?;
                    self.calls = tmp;
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
        if self.calls != 0 {
            my_size += ::protobuf::rt::value_size(1, self.calls, ::protobuf::wire_format::WireTypeVarint);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if self.calls != 0 {
            os.write_int64(1, self.calls)?;
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

impl ::protobuf::MessageStatic for StatsResponse {
    fn new() -> StatsResponse {
        StatsResponse::new()
    }

    fn descriptor_static(_: ::std::option::Option<StatsResponse>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeInt64>(
                    "calls",
                    StatsResponse::get_calls_for_reflect,
                    StatsResponse::mut_calls_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<StatsResponse>(
                    "StatsResponse",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for StatsResponse {
    fn clear(&mut self) {
        self.clear_calls();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for StatsResponse {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for StatsResponse {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\x08bc.proto\x12\x02bc\x1a\ncore.proto\"<\n\x17GetLatestBlocksResponse\
    \x12!\n\x06blocks\x18\x01\x20\x03(\x0b2\t.bc.BlockR\x06blocks\"+\n\x0cHe\
    lpResponse\x12\x1b\n\thelp_text\x18\x01\x20\x01(\tR\x08helpText\"%\n\rSt\
    atsResponse\x12\x14\n\x05calls\x18\x01\x20\x01(\x03R\x05calls2\x8e\x01\n\
    \x02Bc\x12:\n\x0fGetLatestBlocks\x12\x08.bc.Null\x1a\x1b.bc.GetLatestBlo\
    cksResponse\"\0\x12$\n\x04Help\x12\x08.bc.Null\x1a\x10.bc.HelpResponse\"\
    \0\x12&\n\x05Stats\x12\x08.bc.Null\x1a\x11.bc.StatsResponse\"\0b\x06prot\
    o3\
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
