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

pub fn xor_extra(a: &[u8], b: &[u8]) -> Vec<u8> {
    a.iter().zip(b.iter()).map(|(b1, b2)| {
        *b1 ^ *b2
    }).collect()
}

pub fn xor_in_place(a: &mut [u8], b: &[u8]) {
    for (b1, b2) in a.iter_mut().zip(b.iter()) {
        *b1 ^= *b2;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
    fn xor_in_place_test() {
        let mut a: [u8; 4] = [0, 0, 0, 0];
        let b: [u8; 4] = [1, 2, 3, 4];

        xor_in_place(&mut a, &b);
        println!("{:?}", &a);
    }
}

