const { spawn } = require('child_process');
const logger = require('./src/logger');
const path = require('path');
const downloader = require('./src/file-downloader');
const { defaultConversion, folders } = require('./config');
const { errorHandler, getResponseForDocument } = require('./src/common');
const worker  = require('./src/worker');
const fileCleaner = require('./src/file-cleaner');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const queueHandler = function(ch, message) {
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
                 * TODO: All the content that we need after the conversion in inside buffer,
                 * here we might call a route in Hapi and POST the content.
                 */
            })
            .catch(() => ch.ack(message));
        });   
    });
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
    worker(queueHandler);
}
