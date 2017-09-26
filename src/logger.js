const winston = require('winston');
const config = require('../config');
const path = require('path');
const logsFile = path.join(__dirname, '..', config.logsFile);

const logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({filename: logsFile})
    ]
});

module.exports = logger;