'use strict';

var express = require('express'),
    expressWinston = require('express-winston'),
    winston = require('winston'),
    http = require('http'),
    path = require('path'),
    inspect = require('util').inspect,
    app,
    log,
    transportOptions = {
        colorize: true,
        timestamp: true
    };

app = express();

// all environments
app.set('port', process.env.PORT || 3117);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console(transportOptions)
    ]
}));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

log = new winston.Logger({transports: [new winston.transports.Console(transportOptions)]});


app.post('/', function (req, res) {
    log.info(inspect(req.headers));
    return res.status(200);
});

http.createServer(app).listen(app.get('port'), function () {
    log.info('Express server listening on port ' + app.get('port'));
});
