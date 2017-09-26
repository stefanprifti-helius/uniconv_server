const path = require('path');

module.exports = {
    queueName: 'word_import',
    logsFile: 'logs.log',
    connectionString: 'amqp://localhost',
    defaultConversion: 'html',
    folders: {
        input: path.join(__dirname, 'input'),
        output: path.join(__dirname, 'output')
    }
}