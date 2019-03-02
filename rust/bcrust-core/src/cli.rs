#[macro_use]
extern crate log;
extern crate env_logger;
extern crate clap;
extern crate futures;
extern crate grpc;
extern crate httpbis;
extern crate protobuf;
extern crate tls_api;
extern crate num_cpus;
extern crate num_bigint;
extern crate num_traits;
extern crate blake2_rfc;
extern crate rand;
extern crate rustc_serialize;

use clap::{Arg, App, SubCommand};
use std::sync::mpsc::channel;
use std::thread;
use std::thread::JoinHandle;
use std::time::{SystemTime, UNIX_EPOCH};
use blake2_rfc::blake2b::{blake2b};
use rustc_serialize::hex::{ToHex};
use num_bigint::{BigInt};
use std::str::FromStr;
use std::sync::{Mutex, Arc};
use std::env;

use self::protos::miner::{MinerRequest, MinerResponse, MinerResponseResult};
use self::protos::miner_grpc::{Miner, MinerServer};

pub mod data;
pub mod funcs;
pub mod mining;
pub mod protos;

use self::funcs::distance;
use self::mining::primitives::{get_new_block_count, get_new_pre_exp_diff, get_exp_factor_diff};


const AUTHOR: &'static str = env!("CARGO_PKG_AUTHORS");
const DESCRIPTION: &'static str = env!("CARGO_PKG_DESCRIPTION");
const VERSION: &'static str = env!("CARGO_PKG_VERSION");

fn get_random_string() -> u32 {
    rand::random::<u32>()
}

struct MinerImpl {
    pub work_id: Arc<Mutex<String>>
}

impl Miner for MinerImpl {
    fn mine(&self, _o: grpc::RequestOptions, p_in: MinerRequest) -> grpc::SingleResponse<MinerResponse> {
        println!("Miner::mine() - {:?}", &p_in);

        {
            let mut work_id = self.work_id.lock().unwrap();
            *work_id = p_in.clone().get_work_id().to_string();
        }

        let mut threads: Vec<JoinHandle<()>> = Vec::new();
        let (tx, rx) = channel();

        let counter = Arc::new(Mutex::new(0u64));
        let request_exit = Arc::new(Mutex::new(false));

        // Log just start of the work
        let work = p_in.get_work();
        let ts = p_in.get_current_timestamp();
        let diff = p_in.get_difficulty();

        if  ts % 5 == 0 {
            println!(
                "{} mining: work {}..{} last block diff {}",
                &ts,
                &work[0..4],
                &work[work.len()-4..work.len()],
                &diff
            );
        }

        // count logical cores this process could try to use
        let cpu_count = num_cpus::get();
        for _ in 0..cpu_count {
            let tx = tx.clone();
            let p = p_in.clone();

            let counter = Arc::clone(&counter);
            let request_exit = Arc::clone(&request_exit);
            let work_id_current = Arc::clone(&self.work_id);


            threads.push(thread::spawn(move || {
                let miner = p.get_miner_key().clone();
                let merkle_root = p.get_merkle_root();
                let current_timestamp = p.get_current_timestamp();
                // let difficulty = BigInt::from_str(p.get_difficulty()).unwrap();
                let work = p.get_work();
                let work_id = p.get_work_id();
                let last_previous_block = p.get_last_previous_block();

                loop {
                    {
                        let should_exit = request_exit.lock().unwrap();
                        let different_work_id = *work_id_current.lock().unwrap() != p.get_work_id().to_string();

                        if *should_exit && different_work_id {
                            break;
                        }
                    }

                    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                    let nonce = get_random_string();
                    let new_block_count = get_new_block_count(p.get_last_previous_block().get_blockchain_headers(), p.get_new_block_headers());
                    let new_pre_exp_diff = get_new_pre_exp_diff(
                        ts,
                        last_previous_block,
                        new_block_count
                    );

                    let threshold = get_exp_factor_diff(
                        new_pre_exp_diff,
                        last_previous_block.get_height()
                    );

                    let nonce_hash = blake2b(64, &[], nonce.to_string().as_bytes())
                        .as_bytes()[32..64]
                        .to_hex();

                    let in_str = format!("{}{}{}{}", miner, merkle_root, nonce_hash, ts);

                    let result_candidate = blake2b(64, &[], in_str.as_bytes())
                        .as_bytes()[32..64]
                        .to_hex();

                    let threshold = BigInt::from_str(&threshold[..]).unwrap();
                    let s = String::from(work);
                    let r = result_candidate.clone();

                    let similarity = distance(s.as_bytes(), r.as_bytes());
                    let distance = BigInt::from(similarity);

                    let solution_found = distance > threshold;

                    {
                        let mut num = counter.lock().unwrap();
                        *num += 1;
                    }

                    let ts_diff = ts - current_timestamp;

                    if solution_found {
                        let mut response = MinerResponse::new();
                        response.set_difficulty(threshold.to_string());
                        response.set_nonce(nonce.to_string());
                        response.set_timestamp(ts);
                        response.set_time_diff(ts_diff);
                        response.set_distance(distance.to_string());
                        response.set_result(MinerResponseResult::Ok);

                        {
                            let num = counter.lock().unwrap();
                            response.set_iterations(*num);
                        }

                        {
                            let mut should_exit = request_exit.lock().unwrap();
                            *should_exit = true;
                        }

                        let _ = tx.send(response);
                        break;
                    }

                    if ts_diff % 3 == 0 {
                        if *work_id_current.lock().unwrap() != p.get_work_id().to_string() {
                            let mut should_exit = request_exit.lock().unwrap();
                            *should_exit = true;

                            let mut response = MinerResponse::new();
                            response.set_result(MinerResponseResult::Canceled);

                            {
                                let num = counter.lock().unwrap();
                                response.set_iterations(*num);
                            }

                            response.set_timestamp(ts);
                            response.set_time_diff(ts_diff);

                            let _ = tx.send(response);
                            break;
                        }
                    }
                }
            }));
        }

        match rx.recv() {
            Ok(res) => {
                // TODO here we should end all threads working on solved workID?
                grpc::SingleResponse::completed(res)
            }
            Err(err) => {
                debug!("Error occurred: {:?}", &err);

                grpc::SingleResponse::err(grpc::Error::GrpcMessage(grpc::GrpcMessageError {
                    grpc_status: 15,
                    grpc_message: err.to_string()
                }))
            }
        }
    }
}

fn main() {
    let matches = App::new(DESCRIPTION)
        .version(VERSION)
        .author(AUTHOR)
        .get_matches();

    let mut conf = httpbis::ServerConf::default();
    conf.reuse_port = Some(true);

    let implementation = MinerImpl {
        work_id: Arc::new(Mutex::new(String::from("")))
    };

    let mut server = grpc::ServerBuilder::new_plain();
    let default_port = String::from("50051");
    let port: u16 = env::var("BC_GRPC_RUST_MINER_PORT")
        .ok()
        .unwrap_or(default_port)
        .parse()
        .unwrap();
    server.http.conf = conf.clone();
    server.http.set_port(port);
    server.http.set_cpu_pool_threads(4);
    server.add_service(MinerServer::new_service_def(implementation));
    println!("Starting rust miner on *:{}", port);

    let _server = server
        .build()
        .expect("server 1");

    loop {
        thread::park();
    }
}
