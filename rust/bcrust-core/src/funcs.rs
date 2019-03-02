use std::iter;
use std::ops::BitXor;
use std::ops::BitXorAssign;
use std::vec;
use rustc_serialize::hex::{FromHex, ToHex};

pub fn l2norm(a: &[f64]) -> f64 {
    let mut r;
    let mut s = 1.0;
    let mut t = 0.0;

    for val in a {
        let abs = val.abs();
        if abs > t {
            r = t / val;
            s = 1.0 + s * r * r;
            t = abs;
        } else {
            r = val / t;
            s = s + r * r;
        }
    }

    t * s.sqrt()
}

// See https://codereview.stackexchange.com/questions/142331/cosine-similarity
// https://www.npmjs.com/package/compute-cosine-similarity
pub fn cosine_similarity(x: &[f64], y: &[f64]) -> f64 {
    debug!("cosine_similarity({:?}, {:?})", &x, &y);

    let a: f64 = x.iter().zip(y.iter()).map(|(x, y)| x * y).sum();
    let b = l2norm(&x);
    let c = l2norm(&y);

    a / (b * c)
}

pub fn cosine_distance(x: &[f64], y: &[f64]) -> f64 {
    debug!("cosine_distance({:?}, {:?})", &x, &y);

    1.0 - cosine_similarity(&x, &y)
}

pub fn cosine_distance_old(a: &[u8], b: &[u8]) -> f64 {
    debug!("cosine_distance_old({:?}, {:?})", &a, &b);

    let mut mul: f64 = 0.0;
    let mut d_a: f64 = 0.0;
    let mut d_b: f64 = 0.0;

    for i in 0..a.len() {
        mul = mul + (a[i] as f64 * b[i] as f64);
        d_a = d_a + (a[i] as f64 * a[i] as f64);
        d_b = d_b + (b[i] as f64 * b[i] as f64);
    }

    1.0 - (mul / (d_a.sqrt() * d_b.sqrt()))
}
pub fn distance(a: &[u8], b: &[u8]) -> u64 {
    let a_chunks = a.chunks(32).rev();
    let b_chunks = b.chunks(32);

    let chunks = a_chunks.zip(b_chunks);

    let mut result: f64 = 0.0;
    for chunk in chunks {
        let (a, b) = chunk;

        let tmp_a: Vec<f64> = a.iter().map(|item| { *item as f64 }).collect();
        let tmp_b: Vec<f64> = b.iter().map(|item| { *item as f64 }).collect();

        result += cosine_distance(&tmp_a, &tmp_b)
    }

    // see src/mining/primitives.es6 func distance() where result sum is floored and multiplied
    (result * 1e15).floor() as u64
}

pub fn xor<T>(a: &[T], b: &[T]) -> Vec<T>
    where T: BitXor + Copy,
          vec::Vec<T>: iter::FromIterator<<T as BitXor>::Output>
{
    a.iter().zip(b.iter()).map(|(b1, b2)| {
        *b1 ^ *b2
    }).collect()
}

pub fn xor_in_place<T>(a: &mut [T], b: &[T])
    where T: BitXorAssign + Copy
{
    for (b1, b2) in a.iter_mut().zip(b.iter()) {
        *b1 ^= *b2;
    }
}

pub fn xor_hashes(input: &Vec<String>) -> String {
    let mut cloned = input.clone();
    let init = cloned[0].from_hex().unwrap();
    cloned.remove(0);
    let res = cloned.iter().fold(init, |acc, x| {
        xor(&acc, &x.from_hex().unwrap())
    });

    res.to_hex()
}

#[cfg(test)]
mod tests {
    use super::*;
    use rustc_serialize::hex::FromHex;
//    use test::Bencher;

    const NUM_X: [f64; 5] = [ 5.0, 23.0, 2.0, 5.0, 9.0 ];
    const NUM_Y: [f64; 5] = [ 3.0, 21.0, 2.0, 5.0, 14.0 ];
    const NUM_RES: f64 = 1.0 - 0.024612343796039382;

    #[test]
    fn cosine_similarity_test() {
        assert_eq!(cosine_similarity(&NUM_X[..], &NUM_Y[..]), NUM_RES);
    }

//    #[bench]
//    fn cosine_similarity_bench(b: &mut Bencher) {
//        b.iter(|| cosine_similarity(&NUM_X.to_vec(), &NUM_Y.to_vec()));
//    }

    #[test]
    fn xor_test() {
        // See http://tomeko.net/online_tools/xor.php?lang=en

        let a = FromHex::from_hex("9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce").unwrap();
        let b = FromHex::from_hex("781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7").unwrap();
        let res = FromHex::from_hex("e39f0f63f71f0e33e8ed84b3663b2d4a5af86bb4d901d66664f75b94e4491c39").unwrap();

        assert_eq!(xor(&a, &b), res);
    }

    #[test]
    fn xor_in_place_test() {
        // See http://tomeko.net/online_tools/xor.php?lang=en

        let mut a = FromHex::from_hex("9b80fc5cba6238801d745ca139ec639924d27ed004c22609d6d9409f1221b8ce").unwrap();
        let b = FromHex::from_hex("781ff33f4d7d36b3f599d8125fd74ed37e2a1564ddc3f06fb22e1b0bf668a4f7").unwrap();
        let res = FromHex::from_hex("e39f0f63f71f0e33e8ed84b3663b2d4a5af86bb4d901d66664f75b94e4491c39").unwrap();

        xor_in_place(&mut a, &b);
        assert_eq!(a, res);
    }
}

