
var fs = require('fs-extra')
var os = require('os');
var network = require("network");
var strings = require('./utils/strings.js');
var time = require("./utils/time.js");
var Account = require("./account.js");
var getos = require('getos');

var log = global.log;

// TODO: Move somewhere else
function getDataDir(){
    switch(process.platform){
        case 'win32': return process.env.LOCALAPPDATA+"/.blockcollider";
        case 'linux': return process.env.HOME + '/.blockcollider';
        case 'darwin': return process.env.HOME + '/Library/Application Support/.blockcollider';
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

function identity(opts){

    var self = this;
        self.identityFile = "identity.json";
        self.identityPath = getDataDir();

        var platform = os.platform();
        var arch = os.arch();
        var agent = [
            platform+":0",
            arch+":0",
            "BCV:"+ global._BlockColliderVersion
        ];

    self.userAgent = agent.join("/");

    if(opts != undefined && opts.constructor == Object){
        Object.keys(opts).map(function(k){
            self[k] = opts[k];
        });
    }

}

identity.prototype = {

  saveToDisk: function(obj, cb){

    fs.ensureDir(obj.identityPath, function(err){

      if(err) { cb(err); } else {

        obj.createdDate = time.now();

        var str = JSON.stringify(obj);

        fs.writeFile(obj.identityPath+"/"+obj.identityFile, str, "utf8", function(err){
          if(err) { cb(err); } else {
            cb(null, obj);
          }
        });

      }

    });

  },

    getNetworkKey: function(currentIdentity, cb){

        var self = this;

            network.get_active_interface(function(err, active){

                if(err) { cb(err); } else {

                    var key = serializeNetworkInterface(active);

                    if(currentIdentity.networkKey != undefined && currentIdentity.networkKey != key){
                        log.warn("network key has changed "+currentIdentity.networkKey+" -> "+key);
                    }

                    currentIdentity.networkKey = key;

                    cb(null, currentIdentity);

                }

            });

    },

    finalizeSetup: function(currentIdentity, cb){

        var self = this;

        self.getNetworkKey(currentIdentity, function(err, cfg){

      if(err) { console.trace(err); cb(err); } else {

        Object.keys(cfg).map(function(k){
          self[k] = cfg[k];
        });

                var account = new Account({
                    path: self.identityPath,
          file: "accounts.json"
                });

        if(self.colliderBase == undefined){

          account.networkKey = self.networkKey;

            account.createColliderBase(function(err, base){

            if(err) { console.trace(err); process.exit(3); } else {

              self.colliderBase = base;

              log.info("collider base account created: "+base.address);

              self.saveToDisk(self, cb);

            }

          });

        } else {

          self.saveToDisk(self, cb);

        }

      }

        });

    },

    load: function(cb){

        var self = this;

    var file = self.identityPath + "/" + self.identityFile;

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

        log.info("creating new identity file");

                self.finalizeSetup(self, cb);

            }

        });

    }

}

module.exports = identity;
