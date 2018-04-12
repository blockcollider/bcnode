extern crate afl;
extern crate url;

fn main() {
    afl::read_stdio_string(|string| {
        let _ = url::Url::parse(&string);
    });
}
