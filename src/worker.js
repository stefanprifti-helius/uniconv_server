const amqp = require('amqplib/callback_api');
const logger = require('./logger');
const { upstreamQueueName, connectionString } = require('../config');
const { errorHandler } = require('./common');

const worker = function (queueHandler) {
    amqp.connect(connectionString, function(err, conn) {
        if(err) {
            logger.error(`Worker could not connect RabbitMQ server`, err);
            process.exit(0);         
        } else {
            conn.createChannel(function(err, ch) {
                if(err) {
                    logger.error(`RabbitMQ connection could not create a channel`, err);
                    process.exit(0);
                } else {
                    ch.assertQueue(upstreamQueueName, {durable: true});
                    ch.prefetch(1);
        
                    logger.info(" [*] Waiting for jobs in %s.", upstreamQueueName);
        
                    ch.consume(upstreamQueueName, function(message) {
                        queueHandler(ch, message);
                    }, {noAck: false});
                }
            });
        }
      });
}

process.on('exit', (code) => {
    logger.info(`Process terminated with exit code: `, code);
});

module.exports = worker;