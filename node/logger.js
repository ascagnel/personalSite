exports.log = function() {
    var levels = {
        'ALL' : 0,
        'TRACE' : 10,
        'DEBUG' : 20,
        'INFO' : 30,
        'WARN' : 40,
        'ERROR' : 50,
        'FATAL' : 60,
        'NONE' : 1000
    };

    Object.prototype.getKey = function(value) {
        for(var key in this) {
            if(this.hasOwnProperty(key) && (this[key] === value)) {
                    return key
            }
        }
        return null;
    }

    if (exports.log.logLevel === undefined) {
        exports.log.logLevel = levels['INFO'];
    }
    if (exports.log.logPrefix === undefined) {
        exports.log.logPrefix = '%d-%m-%y %H:%M:%S %L: ';
    }

    function parsePrefix(level) {
        var outputString = exports.log.logPrefix;
        var date = new Date();

        function pad(integer, size) {
            var output = new String(integer);
            while (output.length < size) {
                output = "0".toString() + output;
            }
            return output;
        }

        if (exports.log.logPrefix.indexOf('%L') > -1)
            outputString = outputString.replace('%L', levels.getKey(level));

        if (exports.log.logPrefix.indexOf('%H') > -1)
            outputString = outputString.replace('%H', pad(date.getHours(), 2));

        if (exports.log.logPrefix.indexOf('%M') > -1)
            outputString = outputString.replace('%M', pad(date.getMinutes(), 2));

        if (exports.log.logPrefix.indexOf('%S') > -1)
            outputString = outputString.replace('%S', pad(date.getSeconds(), 2));

        if (exports.log.logPrefix.indexOf('%d') > -1)
            outputString = outputString.replace('%d', pad(date.getDate(), 2));

        if (exports.log.logPrefix.indexOf('%m') > -1)
            outputString = outputString.replace('%m', pad(date.getMonth() + 1, 2));

        if (exports.log.logPrefix.indexOf('%y') > -1)
            outputString = outputString.replace('%y', pad(date.getFullYear(), 4));

        return outputString;
    }

    function doLog(level, message) {
        if (exports.log.logLevel <= levels[level]) {
            console.log(parsePrefix(levels[level]) + message);
        }
    }
    
    return {
        displayLevel : function() { console.log('Logging at \'' + levels.getKey(exports.log.logLevel) + '\''); },
        getLogLevel : function() { return levels.getKey(exports.log.logLevel); },
        setLogLevel: function(value) {
            if (levels[value] === undefined) {
                throw "Invalid log level chosen.";
            } else {
                exports.log.logLevel = levels[value];
            }
        },

        logTrace: function(message) { doLog('TRACE', message); },
        logDebug: function(message) { doLog('DEBUG', message); },
        logInfo: function(message) { doLog('INFO', message); },
        logWarning: function(message) { doLog('WARN', message); },
        logError: function(message) { doLog('ERROR', message); },
        logFatal: function(message) { doLog('FATAL', message); },

        displayPrefix: function() { console.log('Logging with logPrefix \'' + exports.log.logPrefix + '\''); },
        setDisplayPrefix: function(value) { exports}
    }
};