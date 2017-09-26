var amqp = require("amqplib/callback_api");

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var q = 'upstream_word_import';

        var job = {
            id: "abc123",
            params: {
                docUrl: "http://www.csus.edu/indiv/n/nogalesp/honorscriticalthinking/cthonorswk1011deductivesentential/ctintrotosymbolizesententiallogic.doc",
                output: "html"
            }
        };

        ch.assertQueue(q, { durable: true });
        ch.sendToQueue(q, Buffer.from(JSON.stringify(job), 'utf8'), {persistent: true});
        console.log(" [x] Sent job");
    });
    setTimeout(function() {
        conn.close();
        process.exit(0);
    }, 500);
});

