'use strict';

var express = require('express'),
    expressWinston = require('express-winston'),
    winston = require('winston'),
    http = require('http'),
    path = require('path'),
    inspect = require('util').inspect,
    _ = require('lodash'),
    childProcess = require('child_process'),
    repos = require('./repos.conf.json'),
    app,
    log,
    LOGFILE = 'hooker.log',
    consoleTransportOptions = {
        colorize: true,
        timestamp: true
    },
    fileTransportOptions = {
        filename: LOGFILE,
        timestamp: true,
        colorize: false
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
        new winston.transports.Console(consoleTransportOptions),
        new winston.transports.File(fileTransportOptions)
    ]
}));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

log = new winston.Logger({
    transports: [
        new winston.transports.Console(consoleTransportOptions),
        new winston.transports.File(fileTransportOptions)
    ]
});

app.post('/', function (req, res) {
    if (typeof req.headers['x-newrelic-id'] === 'undefined') {
        log.error('unknown remote');
        return res.status(404);
    }
    log.info(req.body);
    var data = JSON.parse(req.param('payload')),
        repository = data.repository,
        url,
        repo;
    if (repository) {
        url = repository.url;
        if (url) {
            repo = _.find(repos, function (repo) {
                return repo.url === url;
            });
            if (repo) {
                childProcess.exec(repo.cmd, {
                    cwd: repo.cwd
                }, function (err, stdout, stderr) {
                    if (err) {
                        log.error(err);
                    }
                    if (stdout) {
                        log.info(stdout);
                    }
                    if (stderr) {
                        log.warn(stderr);
                    }
                    return res.status(200);
                });
            }
            else {
                return res.status(403);
            }
        }

    } else {
        return res.status(404);
    }

});

http.createServer(app).listen(app.get('port'), function () {
    log.info('Express server listening on port ' + app.get('port'));
});
