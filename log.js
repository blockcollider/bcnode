
const winston = require('winston');
const moment = require('moment');
const tsFormat = () => (moment().utc().format("YYYYMMDDHHmmss"));

function logger(opts) {

	if(opts == undefined){

		return new (winston.Logger)({
			transports: [
			  new (winston.transports.Console)({ 
                   timestamp: tsFormat,
                   colorize: true 
              }),
			  new (winston.transports.File)({ filename: 'BLOCKCOLLIDER.log' })
			]
		});

	} else {

		return new (winston.Logger)(opts);

	}

}


module.exports = logger;
