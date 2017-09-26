const request = require('request');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const { folders } = require('../config');


module.exports = ({ job }) => {
    return new Promise(function(resolve, reject) {
        const url = job.params.docUrl;
        if (url) {
            const fileName = path.basename(url);
            const filePath = path.join(folders.input, fileName);
            const fileWriteStream = fs.createWriteStream(filePath)
            request(url).pipe(fileWriteStream);

            fileWriteStream.on('error', (err) => {
                logger.error(`Error while writing file `, err);
                return reject();
            });

            fileWriteStream.on('close', () => {
                return resolve(filePath);            
            });
        } else {
            return reject();
        }
    });
}