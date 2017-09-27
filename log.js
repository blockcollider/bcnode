
var winston = require('winston');

function logger(opts) {

	if(opts == undefined){

		return new (winston.Logger)({
			transports: [
			  new (winston.transports.Console)(),
			  new (winston.transports.File)({ filename: 'BLOCKCOLLIDER.log' })
			]
		});

	} else {

		return new (winston.Logger)(opts);

	}

}


module.exports = logger;
