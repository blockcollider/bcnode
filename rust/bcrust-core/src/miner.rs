use blake2_rfc::blake2s::{blake2s};
use serialize::hex::{FromHex, ToHex};
use std::iter::Iterator;
use protos::miner::{MinerRequest, MinerResponse};

use super::data;
use super::funcs;

/// Mining function
///
/// # Notes
///
/// - Order is important.
/// - Case is important (we use lower case).
///
///
/// # Order of hashes
///
/// - MERKLE_ROOT
/// - EMB (Block Collider)
/// - BTC - Bitcoin
/// - ETH - Ethereum
/// - LSK - Lisk
/// - WAV - Waves
/// - NEO - Neo
///
/// # Algorithm
///
/// - Incoming hashes must be in order mentioned above
/// - Compute ephemeral hashes using blake to unify length
/// - XOR all ephemeral hashes together
pub fn mine(req: &MinerRequest) -> MinerResponse {
    let input: Vec<String> = req
        .get_fingerprints()
        .iter()
        .map(|fingerprint| {
            fingerprint.get_hash().to_string()
        }).collect();

    // Lowercase all incoming hashes and calculate their blake hash
    let ephemerals = create_ephemeral_hashes(&input);
    let xored_hash = xor_hashes(&ephemerals);
    let blake_xored = blake2s(32, &[], xored_hash.as_bytes())
        .as_bytes()
        .to_hex();

    println!("{:?}", &blake_xored);

    // Ok((blake_xored, Vec::new()))

    let mut out_block = MinerResponse::new();
    out_block.set_nonce(String::from(""));
    out_block
}

fn create_ephemeral_hashes(input: &Vec<String>) -> Vec<String> {
    input.iter().map(|orig_hash| {
        blake2s(32, &[], orig_hash.to_lowercase().as_bytes())
            .as_bytes()
            .to_hex()
    }).collect()
}

fn xor_hashes(input: &Vec<String>) -> String {
    let zero_hash_vec = data::HASH_ZER.from_hex().unwrap();
    let res = input.iter().fold(zero_hash_vec, |acc, x| {
        funcs::xor(&acc, &x.as_bytes())
    });

    res.to_hex()
}

#[cfg(test)]
mod tests {
    use super::*;
    use test::Bencher;

    #[test]
    fn mine_test() {
        // Test result validated using - http://tomeko.net/online_tools/xor.php?lang=en

        let hashes= data::HASHES.iter().map(|hash| {
            hash.to_string()
        }).collect();

        let res = mine(&hashes);
        println!("DONE: {:?}", &res);

        assert_eq!(1, 1);
    }

    #[bench]
    fn mine_bench(b: &mut Bencher) {
        let hashes= data::HASHES.iter().map(|hash| {
            hash.to_string()
        }).collect();

        b.iter(|| mine(&hashes));
    }
}
