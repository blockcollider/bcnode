use std::sync::mpsc::channel;
use std::thread;

use crypto::digest::Digest;
use crypto::sha2::Sha256;
use num_cpus;
use strsim::jaro_winkler;
use rand;

pub fn mine(input: &[String], threshold: f64) -> Result<(String, Vec<f64>), String> {
    debug!("mine({:?}, {:?})", &input, &threshold);

    let ephemerals: Vec<String> = input.into_iter()
        .map(|val| {
            let mut hasher = Sha256::new();
            hasher.input_str(val);
            hasher.result_str()
        })
        .collect();

    debug!("ephemerals = {:?}", &ephemerals);

    let threshold = 1.0f64 - (threshold as f64);

    // count logical cores this process could try to use
    let cpu_count = num_cpus::get();

    let mut threads = Vec::new();
    let (tx, rx) = channel();
    for _ in 0..cpu_count {
        let e = ephemerals.clone();
        let tx = tx.clone();

        threads.push(thread::spawn(move || {
            let mut r = get_random_string();
            while !(&e).into_iter().all(|val| { distance_check(val, &r, threshold) }) {
                r = get_random_string();
            }

            let _ = tx.send(r);
        }));
    }

    match rx.recv() {
        Ok(res) => {
           let distances: Vec<f64> = (&ephemerals).into_iter().map(|val| {
                distance(val, &res)
            }).collect();

            Ok((res, distances))
        }
        Err(err) => {
            debug!("Error occurred: {:?}", &err);
            Err(String::from("Error"))
        }
    }
}

fn distance (s: &str, r: &str) -> f64 {
    let mut hasher = Sha256::new();
    hasher.input_str(s);
    hasher.input_str(r);
    let res = hasher.result_str();

    jaro_winkler(s, &res).abs()
}

fn distance_check(s: &str, r: &str, threshold: f64) -> bool {
    distance(s, r) > threshold
}

fn get_random_string() -> String {
    rand::random::<u32>().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use test::Bencher;

    #[test]
    fn jaro_winkler_test() {
        assert_eq!(jaro_winkler("abc", "abc").abs(), 1f64);
    }

    #[bench]
    fn get_random_string_bench(b: &mut Bencher) {
        b.iter(|| get_random_string());
    }
}
