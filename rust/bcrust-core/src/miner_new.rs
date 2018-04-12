use blake2_rfc::blake2s::{blake2s};
use serialize::hex::{FromHex, ToHex};

use super::funcs;

pub fn mine(input: &[&str], threshold: f64) -> Result<(String, Vec<f64>), String> {
    debug!("mine({:?}, {:?})", &input, &threshold);

    Ok((String::from("123"), Vec::new()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use test::Bencher;

    const MERKLE_ROOT: &str = "2a0a02a1c21cfb827cdc5d7164d27f039953eb8dae76611b2fa11c9c94211989";

    const HASH_ZER: &str = "0000000000000000000000000000000000000000000000000000000000000000";

    const HASH_BTC: &str = "9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce";
    const HASH_ETH: &str = "781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7";
    const HASH_LSK: &str = "e0f0d5bc8d1fd6d98fc6d1487a2d59b5ed406940cbd33f2f5f065a2594ff4c48";
    const HASH_WAV: &str = "ef631e3582896d9eb9c9477fb09bf8d189afd9bae8f5a577c2107fd0760b022e";
    const HASH_NEO: &str = "e2d5d4f3536cdfa49953fb4a96aa3b4a64fd40c157f1b3c69fb84b3e1693feb0";
    const HASH_EMB: &str = "1f591769bc88e2307d207fc4ee5d519cd3c03e365fa16bf5f63f449b46d6cdef";

    const HASHES: [&str; 7] = [
        HASH_BTC,
        HASH_ETH,
        HASH_LSK,
        HASH_WAV,
        HASH_NEO,
        HASH_EMB,
        // Add merkle root to the end of hashes array
        MERKLE_ROOT
    ];

    #[test]
    fn mine_test() {
        let zero_hash_vec = HASH_ZER.from_hex().unwrap();

        let hashes_vecs = HASHES.iter().map(|hash| {
            hash.from_hex().unwrap()
        });

        let xored_hashes = hashes_vecs.fold(zero_hash_vec, |acc, x| {
            funcs::xor_extra(&acc, &x)
        });

        let blake_hash = blake2s(32, &[], xored_hashes.to_hex().as_bytes());

        println!("{:?}", &blake_hash);

        // assert_eq!(jaro_winkler("abc", "abc").abs(), 1f64);
    }

    #[bench]
    fn mine_bench(b: &mut Bencher) {
        b.iter(|| mine(&HASHES[..], 0.5f64));
    }
}
