// @flow

const program = require("commander")
const dict = require("../../vendor/dict.json");
const pkg = require('../../package.json')
const app = require("../init.js");

// eslint-disable-next-line import/prefer-default-export
module.exports = function main () {

   program
    .version(pkg.version)
    .option('--rpc', 'Start RPC Server')
    .option('--ws', 'Start WebSocket Server')
    .option('--roverbase', 'Start Rover Base Monitor')
    .option('--norovers', 'Disable Rovers')
    .option('--nolog', 'Disable log printing to console')
    .option('--reset', 'Deletes all local data including accounts, databases')
    .option('--rovers [rover,rover]', 'Deploy specified rovers comma sperated')
    .parse(process.argv)

   if(!program.options.length) {

       //[program.help();

   } else {

       if(program.rovers) {

           if(program.rovers.indexOf(",") > -1){

               program.rovers = program.rovers.split(",").reduce(function(all, r){

                    if(dict[r.trim()] != undefined){
                        all.push(dict[r.trim()]);
                    } else {
                        all.push(r.trim());
                    }
                    return all;

               }, []);

           } else {

               program.rovers = [program.rovers.trim()];

           }

       }

   }
  
   app(program);

}
