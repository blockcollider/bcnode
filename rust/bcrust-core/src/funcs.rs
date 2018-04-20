use std::iter;
use std::ops::BitXor;
use std::ops::BitXorAssign;
use std::vec;

// See https://codereview.stackexchange.com/questions/142331/cosine-similarity
// https://www.npmjs.com/package/compute-cosine-similarity
pub fn cosine_similarity(a: &Vec<u8>, b: &Vec<u8>) -> f64 {
    debug!("cosine_similarity({:?}, {:?})", &a, &b);

    let mut mul: f64 = 0.0;
    let mut d_a: f64 = 0.0;
    let mut d_b: f64 = 0.0;

    for i in 0..a.len() {
        mul = mul + (a[i] as f64 * b[i] as f64);
        d_a = d_a + (a[i] as f64 * a[i] as f64);
        d_b = d_b + (b[i] as f64 * b[i] as f64);
    }

    mul / (d_a.sqrt() * d_b.sqrt())
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

#[cfg(test)]
mod tests {
    use super::*;
    use serialize::hex::FromHex;
    use test::Bencher;

    const NUM_X: [u8; 5] = [ 5, 23, 2, 5, 9 ];
    const NUM_Y: [u8; 5] = [ 3, 21, 2, 5, 14 ];
    const NUM_RES: f64 = 0.9753876562039606f64;

    #[test]
    fn cosine_similarity_test() {
        assert_eq!(cosine_similarity(&NUM_X.to_vec(), &NUM_Y.to_vec()), NUM_RES);
    }

    #[bench]
    fn cosine_similarity_bench(b: &mut Bencher) {
        b.iter(|| cosine_similarity(&NUM_X.to_vec(), &NUM_Y.to_vec()));
    }

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

