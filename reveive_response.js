const amqp = require('amqplib/callback_api');
const { downstreamQueueName } = require('./config');

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    ch.assertQueue(downstreamQueueName, {durable: false});
    console.log(" [*] Waiting for messages in %s.", downstreamQueueName);
    ch.consume(downstreamQueueName, function(msg) {
      console.log(" [x] Received %s", msg.content.toString());
    }, {noAck: true});
  });
});