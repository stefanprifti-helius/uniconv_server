const { spawn } = require('child_process');
const logger = require('./src/logger');
const path = require('path');
const downloader = require('./src/file-downloader');
const { defaultConversion, downstreamQueueName, folders } = require('./config');
const { errorHandler, getResponseForDocument } = require('./src/common');
const worker  = require('./src/worker');
const fileCleaner = require('./src/file-cleaner');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const upstreamQueueHandler = function(ch, message) {
    const job = JSON.parse(message.content.toString('utf8'));
    const conversionType = job.params.output || defaultConversion;

    logger.info("Started job with id %s", job.id);

    downloader({ job })
    .catch(errorHandler)
    .then((filePath) => {
        const outputFileName = path.parse(filePath).name
        const outputAbsolutePath = `${folders.output}/${outputFileName}.${conversionType}`

        const unoconv = spawn('unoconv', ['-vvv', '-f', conversionType, '-o', outputAbsolutePath, filePath]);
        
        unoconv.stdout.on('data', (data) => logger.info(`${data}`));
        unoconv.stderr.on('data', (data) => logger.error(`${data}`));
        
        unoconv.on('close', (code) => {
            var buffer = {};

            logger.info(`Unoconv process exited with code ${code}`);
            logger.info("Job with id %s is done!", job.id);

            getResponseForDocument({ output: outputAbsolutePath, job: job, input: filePath})
            .then ((response) => buffer.response = response)
            .then(() => fileCleaner({ input: filePath, output: outputAbsolutePath }))
            .then(() => ch.ack(message))
            .then(() => {
                /**
                 * Here qe create a new queue in the same channel
                 * this queue will downstream to hapi the response of the conversion
                 */
                downstreamQueueHandler(ch, buffer);
            })
            .catch(() => ch.ack(message));
        });   
    });
};

const downstreamQueueHandler = (ch, buffer) => {
    ch.assertQueue(downstreamQueueName, {durable: false});
    ch.sendToQueue(downstreamQueueName, Buffer.from(JSON.stringify(buffer), "utf8"));
};

if (cluster.isMaster) {
    logger.info(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        logger.info(`Worker ${worker.process.pid} died`);
    });
} else {
    logger.info(`Worker ${process.pid} started`);
    worker(upstreamQueueHandler);
}