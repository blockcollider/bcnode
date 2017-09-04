
var log = global.log;

function Network(){

    if (!global._HelixConfig)
        log.error("cannot start network module without load identity configuration");
        process.exit(3);

}

module.exports = Network;
