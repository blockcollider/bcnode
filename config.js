
var fs = require('fs-extra')
var os = require('os');
var network = require("network");
var strings = require('./strings.js');
var time = require("./time.js");

var log = global.log;

function getDataDir(){
    switch(process.platform){
        case 'win32': return process.env.LOCALAPPDATA+"/.helix";
        case 'linux': return process.env.HOME + '/.helix';
        case 'darwin': return process.env.HOME + '/Library/Application Support/.helix';
        default: throw Error("unknown platform "+process.platform);
    }
}


function serializeNetworkInterface(active){

    /*
         The signing parameter when available prepends the network key. 

         m = mac address
         i = private ip/local ip  
         b = browser  
         t = testnet

         ex. "m-e3b98a4da31a127d4bde..." means MAC address was used in generation

    */

    // String is a testnet if mac address cannot be established.
    var rootString ;

    if(active.mac_address != undefined){
        rootString = "m-"+strings.sha(active.mac_address);
        return rootString;
    }

    if(active.ip_address != undefined){
        rootString = "i-"+strings.sha(active.ip_address);
        return rootString;
    }

    if(active != undefined){
        rootString = "t-"+strings.randomSha();
        return rootString;
    }

    return Error("unable to serialize network interface");

}

function config(opts){

    var self = this;
        self.configFile = "config.json";
        self.configPath = getDataDir(); 
        self.endianness = os.endianness();
        self.platform = os.platform();
        self.arch = os.arch();

    if(opts != undefined && opts.constructor == Object){
        Object.keys(opts).map(function(k){
            self[k] = opts[k];
        });
    }
    
}

config.prototype = {

	saveToDisk: function(obj, cb){

		fs.ensureDir(obj.configPath, function(err){

			if(err) { cb(err); } else {

				obj.createdDate = time.now();

				var str = JSON.stringify(obj);	

				fs.writeFile(obj.configPath+"/"+obj.configFile, str, "utf8", function(err){
					if(err) { cb(err); } else {
						cb(null, obj);
					}
				});

			}

		});

	},

    getNetworkKey: function(currentConfig, cb){

        var self = this;

        network.get_active_interface(function(err, active){

            if(err) { cb(err); } else {

                var key = serializeNetworkInterface(active);

                if(currentConfig.networkKey != undefined && currentConfig.networkKey != key){
					log.warn("network key has changed "+currentConfig.networkKey+" -> "+key); 
                }

				currentConfig.networkKey = key;

				cb(null, currentConfig);

            }

        });

    },

    finalizeSetup: function(currentConfig, cb){

        var self = this;

        self.getNetworkKey(currentConfig, function(err, cfg){

			if(err) { cb(err); } else {

				Object.keys(cfg).map(function(k){
					self[k] = cfg[k];
				});

				self.saveToDisk(self, cb);

			}

        });

    },

    load: function(cb){

        var self = this;

		var file = self.configPath + "/" + self.configFile;

        fs.pathExists(file, function(err, exists){

            if(exists == true){

                fs.readFile(file, "utf8", function(err, data){

                    if(err) { cb(err); } else {

                        try { 

                            var d = JSON.parse(data);

                            self.finalizeSetup(d, cb);

                        } catch(err) { 
                            cb(err);
                        }

                    }

                });

            } else {

				log.info("creating new configuration file");

                self.finalizeSetup(self, cb);

            }

        });

    }

}

module.exports = config;
