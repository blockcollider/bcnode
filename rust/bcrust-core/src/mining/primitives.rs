// Copyright (c) 2017-present, Block Collider developers, All rights reserved.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
use std::str::FromStr;
use std::collections::HashSet;

use blake2_rfc::blake2b::{blake2b};
use rustc_serialize::hex::{ToHex};
use num_bigint::BigInt;
use num_traits::{ToPrimitive, pow};

use funcs::xor_hashes;

use protos::core::{BlockchainHeaders, BlockchainHeader, BcBlock};
use super::traits::RoveredBlockLike;

const MINIMUM_DIFFICULTY: u64 = 291112262029012;

pub fn block_hash (msg: &RoveredBlockLike) -> String {
    let hash = msg.get_hash();
    let merkle_root = msg.get_merkle_root();
    let payload = format!("{}{}", hash, merkle_root);

    blake2b(64, &[], payload.as_bytes())
        .as_bytes()[32..64]
        .to_hex()
}

pub fn blockchain_headers_to_list(blockchain_headers: &BlockchainHeaders) -> Vec<BlockchainHeader> {
    let mut headers: Vec<BlockchainHeader> = vec![];

    headers.extend_from_slice(blockchain_headers.get_btc());
    headers.extend_from_slice(blockchain_headers.get_eth());
    headers.extend_from_slice(blockchain_headers.get_lsk());
    headers.extend_from_slice(blockchain_headers.get_neo());
    headers.extend_from_slice(blockchain_headers.get_wav());

    headers
}

pub fn get_children_block_hashes(blockchain_headers: &BlockchainHeaders) -> Vec<String> {
    let headers_list = blockchain_headers_to_list(blockchain_headers);
    headers_list
        .iter()
        .map(|h| { block_hash(h) })
        .collect()
}

pub fn get_children_root_hash(hashes: &[String]) -> String {
    xor_hashes(&hashes.to_vec())
}

pub fn get_parent_share_diff(parent_difficulty: u64, child_chain_count: u8) -> u64 {
    parent_difficulty / child_chain_count as u64
}

pub fn get_minimum_difficulty(child_chain_count: u8) -> u64 {
    MINIMUM_DIFFICULTY / child_chain_count as u64
}

pub fn get_exp_factor_diff(calculated_difficulty: String, parent_block_height: u64) -> String {
    let big_2 = BigInt::from(2);
    let period_count = BigInt::from((parent_block_height + 1) / 66000000); // TODO extract to constant
    if period_count > big_2 {
        let result = BigInt::from_str(calculated_difficulty.as_str()).unwrap()
            + pow(BigInt::from(2), (period_count - big_2).to_usize().unwrap());
        return result.to_string()
    }

    format!("{}", calculated_difficulty)
}

pub fn get_new_block_count(previous_headers: &BlockchainHeaders, current_headers: &BlockchainHeaders) -> u8 {
    let mut a: HashSet<String> = HashSet::new();
    let mut b: HashSet<String> = HashSet::new();

    for header in blockchain_headers_to_list(previous_headers).iter() {
        a.insert(header.get_hash().to_string());
    }

    for header in blockchain_headers_to_list(current_headers).iter() {
        b.insert(header.get_hash().to_string());
    }

    b.difference(&a).count() as u8
}

pub fn get_diff(
    current_block_time: u64,
    previous_block_time: u64,
    previous_difficulty: &str,
    minimal_difficulty: u64,
    new_block_count: u8,
    newest_child_header: &RoveredBlockLike
) -> String {
    let target_time_window = 8;
    let child_header_time = newest_child_header.get_timestamp() / 1000;
    let child_header_time_bound = child_header_time + target_time_window * 2;
    let stale_cost = (current_block_time - child_header_time_bound) / target_time_window;
    let elapsed_time = BigInt::from(current_block_time) - BigInt::from(previous_block_time) - BigInt::from(stale_cost);
    let elapsed_time_bonus = elapsed_time.clone() + (elapsed_time.clone() - (7 * new_block_count as u64));
    let elapsed = if elapsed_time_bonus > BigInt::from(0) {
        elapsed_time_bonus
    } else {
        elapsed_time
    };

    let mut x = BigInt::from(1) - elapsed / target_time_window;
    if x < BigInt::from(-99) {
        x = BigInt::from(-99);
    }

    // this guard has to be here because of specific case of block utils/templates/bc.block.93699
    // which sadly does not have difficulty specified
    let previous_difficulty_big = match previous_difficulty == "" {
        true => BigInt::from(MINIMUM_DIFFICULTY),
        false => BigInt::from_str(previous_difficulty).unwrap()
    };

    // y = previous_difficulty -> SPECTRUM: 10062600 // AT: 1615520 // BT: ((32 * 16) / 2PI ) * 10 = 815 chain count + hidden chain = 508
    let y = previous_difficulty_big.clone() / BigInt::from(815);

    let calculated_difficulty = x * y + previous_difficulty_big;

    if calculated_difficulty < BigInt::from(minimal_difficulty) {
        return format!("{}", minimal_difficulty);
    }

    calculated_difficulty.to_string()
}

fn get_newest_header(block: &BcBlock) -> BlockchainHeader {
    let mut headers_list = blockchain_headers_to_list(block.get_blockchain_headers());
    headers_list.sort_by(|a, b| {
        let a_ts = a.get_timestamp();
        let b_ts = b.get_timestamp();
        a_ts.cmp(&b_ts)
    });

    let newest = headers_list[0].clone();
    newest
}

pub fn get_new_pre_exp_diff(current_timestamp: u64, last_previous_block: &BcBlock, new_block_count: u8) -> String {
    get_diff(
        current_timestamp,
        last_previous_block.get_timestamp(),
        last_previous_block.get_difficulty(),
        MINIMUM_DIFFICULTY,
        new_block_count,
        &get_newest_header(last_previous_block)
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use protobuf::RepeatedField;
    use super::super::super::protos::core::Block;

    const CORRECT_HASH_EMPTY_STRING_B: &str = "d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce";

    #[test]
    fn block_hash_blockchain_header_test() {
        assert_eq!(block_hash(&BlockchainHeader::new()), CORRECT_HASH_EMPTY_STRING_B.to_string());
    }

    #[test]
    fn block_hash_block_test() {
        assert_eq!(block_hash(&Block::new()), CORRECT_HASH_EMPTY_STRING_B.to_string());
    }

    #[test]
    fn get_children_block_hashes_test() {
        let mut headers = BlockchainHeaders::new();
        let btcs = vec![BlockchainHeader::new()];
        headers.set_btc(RepeatedField::from_vec(btcs));
        assert_eq!(get_children_block_hashes(&headers), vec![CORRECT_HASH_EMPTY_STRING_B.to_string()])
    }

    #[test]
    fn get_children_root_hash_test() {
        let hash_a = blake2b(64, &[], "a".as_bytes())
            .as_bytes()[32..64]
            .to_hex();
        let hash_b = blake2b(64, &[], "b".as_bytes())
            .as_bytes()[32..64]
            .to_hex();
        let hashes = &[hash_a, hash_b];

        const CORRECT_A_B_CHILDREN_ROOT: &str = "930af0a9ddc0507cc4b3b719f434109d2a894286119b98f4ff77ee7ff358735e";
        assert_eq!(get_children_root_hash(hashes), CORRECT_A_B_CHILDREN_ROOT.to_string())
    }

    #[test]
    fn get_exp_factor_diff_test() {
        assert_eq!(get_exp_factor_diff(String::from("1024"), 1), "1024".to_string());
        assert_eq!(get_exp_factor_diff(String::from("290112262029012"), 66000000 * 3), "290112262029014".to_string())
    }

    #[test]
    fn get_diff_test() {
        const EXPECTED_DIFF: &str = "8528842191046319905908";
        let mut newest_header = BlockchainHeader::new();
        newest_header.set_timestamp(1534956353000);
        let received_diff = get_diff(
            1534956535000,
            1534956531000,
            "290112262029015",
            MINIMUM_DIFFICULTY,
            3,
            &newest_header
        );
        assert_eq!(received_diff, EXPECTED_DIFF.to_string())
    }

    #[test]
    fn get_new_block_count_test() {
        let mut a_header = BlockchainHeader::new();
        a_header.set_hash(String::from("a_hash_1234"));

        let mut a_headers = BlockchainHeaders::new();
        let a_btcs = vec![a_header.clone()];
        a_headers.set_btc(RepeatedField::from_vec(a_btcs));

        let mut b_header = BlockchainHeader::new();
        b_header.set_hash(String::from("b_hash_5678"));

        let mut b_headers = BlockchainHeaders::new();
        let b_btcs = vec![a_header, b_header];
        b_headers.set_btc(RepeatedField::from_vec(b_btcs));

        assert_eq!(get_new_block_count(&a_headers, &b_headers), 1);
    }
}
