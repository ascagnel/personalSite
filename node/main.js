var http = require('http');
var fs = require('fs');
var parser = require('./parser.js');
var logger = require('./logger');
var port = process.env.port || 3000;
var prefix = "html";

logger.log().setLogLevel('DEBUG');

http.createServer(function (req,res) {
    var path = req.url;
    if (path == '/') {
        path = prefix + '/index.html';
    } else if (path == '/favicon.ico') {
        path = 'images/favicon.ico';
    } else {
        path = prefix + path
    }
    logger.log().logTrace("request path: " + path);

    var err_code = 500;

    var content = "";
    fs.readFile(path, function(err,data) {
        if (err) {
            logger.log().logError("404 Error: " + req.url);

            try {
                buffer = fs.readFileSync(prefix + "/404.html");
            } catch (e) {
                logger.log().logFatal("Fatal error on 404 error!");
                throw err;
            }

            logger.log().logTrace(buffer);
            content = buffer.toString('utf8', 0, buffer.length);
            err_code = 404;
        } else {
            logger.log().logDebug('OK: ' + path);
            content = data.toString('utf8', 0, data.length);
            err_code = 200;
        }

        if (path.substr(-4) === 'html') {
            content = parser.parse(content,0);
        } else {
            logger.log().logDebug('Skipping parse of non-HTML file.');
        }

        res.writeHead(err_code, {'Content-Type':'text/html', 'Content-length':content.length});
        res.write(parser.parse(content));
        res.end();
        logger.log().logTrace('Finished request.');
    });
}).listen(port);

logger.log().logInfo("Server running at http://127.0.0.1:" + port + "/");

