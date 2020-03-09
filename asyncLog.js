function asyncLog(logger, logLevel, logMessage) {
    return new Promise((res, rej) => {
        try {
            logger.log({ level: logLevel, message: logMessage });
            res();
        }
        catch(err) {
            rej();
        }
    });
}

module.exports = asyncLog;