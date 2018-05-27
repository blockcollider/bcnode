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
pub struct MessageGetObjectsRequest {
    // message fields
    pub field_type: MsgType,
    pub body: ObjType,
    // special fields
    unknown_fields: ::protobuf::UnknownFields,
    cached_size: ::protobuf::CachedSize,
}

// see codegen.rs for the explanation why impl Sync explicitly
unsafe impl ::std::marker::Sync for MessageGetObjectsRequest {}

impl MessageGetObjectsRequest {
    pub fn new() -> MessageGetObjectsRequest {
        ::std::default::Default::default()
    }

    pub fn default_instance() -> &'static MessageGetObjectsRequest {
        static mut instance: ::protobuf::lazy::Lazy<MessageGetObjectsRequest> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const MessageGetObjectsRequest,
        };
        unsafe {
            instance.get(MessageGetObjectsRequest::new)
        }
    }

    // .bc.MsgType type = 1;

    pub fn clear_field_type(&mut self) {
        self.field_type = MsgType::GetObjectsRequest;
    }

    // Param is passed by value, moved
    pub fn set_field_type(&mut self, v: MsgType) {
        self.field_type = v;
    }

    pub fn get_field_type(&self) -> MsgType {
        self.field_type
    }

    fn get_field_type_for_reflect(&self) -> &MsgType {
        &self.field_type
    }

    fn mut_field_type_for_reflect(&mut self) -> &mut MsgType {
        &mut self.field_type
    }

    // .bc.ObjType body = 2;

    pub fn clear_body(&mut self) {
        self.body = ObjType::BlockHeaders;
    }

    // Param is passed by value, moved
    pub fn set_body(&mut self, v: ObjType) {
        self.body = v;
    }

    pub fn get_body(&self) -> ObjType {
        self.body
    }

    fn get_body_for_reflect(&self) -> &ObjType {
        &self.body
    }

    fn mut_body_for_reflect(&mut self) -> &mut ObjType {
        &mut self.body
    }
}

impl ::protobuf::Message for MessageGetObjectsRequest {
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
                    let tmp = is.read_enum()?;
                    self.field_type = tmp;
                },
                2 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_enum()?;
                    self.body = tmp;
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
        if self.field_type != MsgType::GetObjectsRequest {
            my_size += ::protobuf::rt::enum_size(1, self.field_type);
        }
        if self.body != ObjType::BlockHeaders {
            my_size += ::protobuf::rt::enum_size(2, self.body);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream) -> ::protobuf::ProtobufResult<()> {
        if self.field_type != MsgType::GetObjectsRequest {
            os.write_enum(1, self.field_type.value())?;
        }
        if self.body != ObjType::BlockHeaders {
            os.write_enum(2, self.body.value())?;
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

impl ::protobuf::MessageStatic for MessageGetObjectsRequest {
    fn new() -> MessageGetObjectsRequest {
        MessageGetObjectsRequest::new()
    }

    fn descriptor_static(_: ::std::option::Option<MessageGetObjectsRequest>) -> &'static ::protobuf::reflect::MessageDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::MessageDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::MessageDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                let mut fields = ::std::vec::Vec::new();
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeEnum<MsgType>>(
                    "type",
                    MessageGetObjectsRequest::get_field_type_for_reflect,
                    MessageGetObjectsRequest::mut_field_type_for_reflect,
                ));
                fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeEnum<ObjType>>(
                    "body",
                    MessageGetObjectsRequest::get_body_for_reflect,
                    MessageGetObjectsRequest::mut_body_for_reflect,
                ));
                ::protobuf::reflect::MessageDescriptor::new::<MessageGetObjectsRequest>(
                    "MessageGetObjectsRequest",
                    fields,
                    file_descriptor_proto()
                )
            })
        }
    }
}

impl ::protobuf::Clear for MessageGetObjectsRequest {
    fn clear(&mut self) {
        self.clear_field_type();
        self.clear_body();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for MessageGetObjectsRequest {
    fn fmt(&self, f: &mut ::std::fmt::Formatter) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for MessageGetObjectsRequest {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Message(self)
    }
}

#[derive(Clone,PartialEq,Eq,Debug,Hash)]
pub enum ObjType {
    BlockHeaders = 0,
    BlockBodies = 1,
    BlockTransactions = 2,
    RoverBestHeights = 3,
    RoverBlockHeaders = 4,
    RoverBlockBodies = 5,
    RoverTransactionHeaders = 6,
    RoverMarkedHeaders = 7,
}

impl ::protobuf::ProtobufEnum for ObjType {
    fn value(&self) -> i32 {
        *self as i32
    }

    fn from_i32(value: i32) -> ::std::option::Option<ObjType> {
        match value {
            0 => ::std::option::Option::Some(ObjType::BlockHeaders),
            1 => ::std::option::Option::Some(ObjType::BlockBodies),
            2 => ::std::option::Option::Some(ObjType::BlockTransactions),
            3 => ::std::option::Option::Some(ObjType::RoverBestHeights),
            4 => ::std::option::Option::Some(ObjType::RoverBlockHeaders),
            5 => ::std::option::Option::Some(ObjType::RoverBlockBodies),
            6 => ::std::option::Option::Some(ObjType::RoverTransactionHeaders),
            7 => ::std::option::Option::Some(ObjType::RoverMarkedHeaders),
            _ => ::std::option::Option::None
        }
    }

    fn values() -> &'static [Self] {
        static values: &'static [ObjType] = &[
            ObjType::BlockHeaders,
            ObjType::BlockBodies,
            ObjType::BlockTransactions,
            ObjType::RoverBestHeights,
            ObjType::RoverBlockHeaders,
            ObjType::RoverBlockBodies,
            ObjType::RoverTransactionHeaders,
            ObjType::RoverMarkedHeaders,
        ];
        values
    }

    fn enum_descriptor_static(_: ::std::option::Option<ObjType>) -> &'static ::protobuf::reflect::EnumDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::EnumDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::EnumDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                ::protobuf::reflect::EnumDescriptor::new("ObjType", file_descriptor_proto())
            })
        }
    }
}

impl ::std::marker::Copy for ObjType {
}

impl ::std::default::Default for ObjType {
    fn default() -> Self {
        ObjType::BlockHeaders
    }
}

impl ::protobuf::reflect::ProtobufValue for ObjType {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Enum(self.descriptor())
    }
}

#[derive(Clone,PartialEq,Eq,Debug,Hash)]
pub enum MsgType {
    GetObjectsRequest = 0,
}

impl ::protobuf::ProtobufEnum for MsgType {
    fn value(&self) -> i32 {
        *self as i32
    }

    fn from_i32(value: i32) -> ::std::option::Option<MsgType> {
        match value {
            0 => ::std::option::Option::Some(MsgType::GetObjectsRequest),
            _ => ::std::option::Option::None
        }
    }

    fn values() -> &'static [Self] {
        static values: &'static [MsgType] = &[
            MsgType::GetObjectsRequest,
        ];
        values
    }

    fn enum_descriptor_static(_: ::std::option::Option<MsgType>) -> &'static ::protobuf::reflect::EnumDescriptor {
        static mut descriptor: ::protobuf::lazy::Lazy<::protobuf::reflect::EnumDescriptor> = ::protobuf::lazy::Lazy {
            lock: ::protobuf::lazy::ONCE_INIT,
            ptr: 0 as *const ::protobuf::reflect::EnumDescriptor,
        };
        unsafe {
            descriptor.get(|| {
                ::protobuf::reflect::EnumDescriptor::new("MsgType", file_descriptor_proto())
            })
        }
    }
}

impl ::std::marker::Copy for MsgType {
}

impl ::std::default::Default for MsgType {
    fn default() -> Self {
        MsgType::GetObjectsRequest
    }
}

impl ::protobuf::reflect::ProtobufValue for MsgType {
    fn as_ref(&self) -> ::protobuf::reflect::ProtobufValueRef {
        ::protobuf::reflect::ProtobufValueRef::Enum(self.descriptor())
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\x0eprotocol.proto\x12\x02bc\"\\\n\x18MessageGetObjectsRequest\x12\x1f\
    \n\x04type\x18\x01\x20\x01(\x0e2\x0b.bc.MsgTypeR\x04type\x12\x1f\n\x04bo\
    dy\x18\x02\x20\x01(\x0e2\x0b.bc.ObjTypeR\x04body*\xbb\x01\n\x07ObjType\
    \x12\x10\n\x0cBlockHeaders\x10\0\x12\x0f\n\x0bBlockBodies\x10\x01\x12\
    \x15\n\x11BlockTransactions\x10\x02\x12\x14\n\x10RoverBestHeights\x10\
    \x03\x12\x15\n\x11RoverBlockHeaders\x10\x04\x12\x14\n\x10RoverBlockBodie\
    s\x10\x05\x12\x1b\n\x17RoverTransactionHeaders\x10\x06\x12\x16\n\x12Rove\
    rMarkedHeaders\x10\x07*\x20\n\x07MsgType\x12\x15\n\x11GetObjectsRequest\
    \x10\0b\x06proto3\
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
