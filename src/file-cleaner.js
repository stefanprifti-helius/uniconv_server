const fs = require('fs-extra');
const logger = require('./logger');

module.exports = ({output, input}) => {
    return Promise.all([fs.unlink(output), fs.unlink(input)])
    .catch((err) => {
        logger.info(`Error deleting files, input `, input, `or output`, output);
    });
};