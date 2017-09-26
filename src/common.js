const logger = require('./logger');
const fs = require('fs-extra');

module.exports = {
    errorHandler: (err) => {
        logger.error(err);
    },
    getResponseForDocument: ({input, job, output}) => {
        return new Promise(function(resolve, reject) {
            fs.readFile(output, 'utf8')
            .then((text) => {
                return resolve({
                    convertedContent: text,
                    job: job
                });
            })
            .catch((err) => {
                logger.error(`Failed to read the file`, output);
                return reject(err);
            });
        });
    }
}