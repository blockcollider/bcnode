use blake2_rfc::blake2b::{blake2b};
use rustc_serialize::hex::{ToHex};
use std::iter::Iterator;
use protos::miner::{MinerRequest, MinerResponse};

/// Mining function
///
/// # Notes
///
/// - Case is important (we use lower case).
///
/// # Algorithm
///
/// - Incoming hashes must be in order mentioned above
/// - Compute ephemeral hashes using blake to unify length
/// - XOR all ephemeral hashes together
pub fn mine(req: &MinerRequest) -> MinerResponse {
//    let input: Vec<String> = req
//        .get_fingerprints()
//        .iter()
//        .map(|fingerprint| {
//            fingerprint.get_hash().to_string()
//        }).collect();
//
//    // Lowercase all incoming hashes and calculate their blake hash
//    let ephemerals = create_ephemeral_hashes(&input);
//    let xored_hash = funcs::xor_hashes(&ephemerals);
//    let blake_xored = blake2b(64, &[], xored_hash.as_bytes())
//        .as_bytes()
//        .to_hex();
//
//    println!("{:?}", &blake_xored);
//
//    // Ok((blake_xored, Vec::new()))

    let mut out_block = MinerResponse::new();
    out_block.set_nonce(String::from(""));
    out_block
}

fn create_ephemeral_hashes(input: &Vec<String>) -> Vec<String> {
    input.iter().map(|orig_hash| {
        blake2b(64, &[], orig_hash.to_lowercase().as_bytes())
            .as_bytes()
            .to_hex()
    }).collect()
}
