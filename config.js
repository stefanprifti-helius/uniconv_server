const path = require('path');

module.exports = {
    upstreamQueueName: 'upstream_word_import',
    downstreamQueueName: 'downstream_word_import',
    logsFile: 'logs.log',
    connectionString: 'amqp://localhost',
    defaultConversion: 'html',
    folders: {
        input: path.join(__dirname, 'input'),
        output: path.join(__dirname, 'output')
    }
}