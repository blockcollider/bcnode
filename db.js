var db = require("linvodb3");
var _ = require('lodash');

    // db.defaults.store = { db: require("level-js") };  // browser

function DB(opts){

    var options = {
        dir: "./tmp",
        model: "collider",
        schema: {},
        options: {}
    }

    if(opts != undefined){
        Object.keys(opts).map(function(k){
            options[k] = opts[k]
        });
    }

    db.dbPath = options.path;

    this.record = new db(options.model, options.schema, options.options); 

}

DB.prototype = {

    update: function(query, data, cb){

        var self = this;


            self.record.findOne(query, function(err, b){
                
                if(b != undefined){
                    Object.keys(data).map(function(k){
                        b[k] = data[k];
                    });

                    b.save(cb);

                } else {

                    var b = _.merge(query, data);

                    var doc = new self.record(b);

                        doc.save(cb);

                }
                
            }); 

    },

    find: function(query, cb){

        var self = this;

        self.record.find(query, cb); 
            
    }

}

module.exports = DB;


