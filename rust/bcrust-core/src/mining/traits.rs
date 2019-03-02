// Copyright (c) 2017-present, Block Collider developers, All rights reserved.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
use super::super::protos::core::{BlockchainHeader, Block};
use std::hash::{Hash, Hasher};

pub trait RoveredBlockLike {
    fn get_blockchain(&self) -> &str;
    fn get_hash(&self) -> &str;
    fn get_previous_hash(&self) -> &str;
    fn get_timestamp(&self) -> u64;
    fn get_height(&self) -> u64;
    fn get_merkle_root(&self) -> &str;
}

impl RoveredBlockLike for BlockchainHeader {
    fn get_blockchain(&self) -> &str {
        &self.blockchain
    }
    fn get_hash(&self) -> &str {
        &self.merkle_root
    }
    fn get_previous_hash(&self) -> &str {
        &self.merkle_root
    }
    fn get_timestamp(&self) -> u64 {
        self.timestamp
    }
    fn get_height(&self) -> u64 {
        self.height
    }
    fn get_merkle_root(&self) -> &str { &self.merkle_root }
}

impl RoveredBlockLike for Block {
    fn get_blockchain(&self) -> &str {
        &self.blockchain
    }
    fn get_hash(&self) -> &str {
        &self.merkle_root
    }
    fn get_previous_hash(&self) -> &str {
        &self.merkle_root
    }
    fn get_timestamp(&self) -> u64 {
        self.timestamp
    }
    fn get_height(&self) -> u64 {
        self.height
    }
    fn get_merkle_root(&self) -> &str { &self.merkle_root }
}

//impl PartialEq for Block {
//    fn eq(&self, other: &Block) -> bool {
//        self.get_hash() == other.get_hash()
//    }
//}
//
impl Eq for Block {}

impl Hash for Block {
    fn hash<H: Hasher>(&self, state: &mut H) {
        state.write(self.get_hash().as_bytes());
    }
}
//
//impl PartialEq for BlockchainHeader {
//    fn eq(&self, other: &Block) -> bool {
//        self.get_hash() == other.get_hash()
//    }
//}

impl Eq for BlockchainHeader {}

impl Hash for BlockchainHeader {
    fn hash<H: Hasher>(&self, state: &mut H) {
        state.write(self.get_hash().as_bytes());
    }
}
