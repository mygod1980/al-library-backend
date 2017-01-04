'use strict';
// Expose app
module.exports = function () {
    var
        init = require('config/init')(),
        config = require('config/config'),
        log = require('config/log')(module)
        ;

    var toolName = process.argv[3];

    log.info('Running tool: ' + toolName);

    require('tools/' + toolName)()
        .then(
            function (result) {
                log.info('completed with result: ' + result);
            }
        )
        .catch(function (err) {
                log.error('completed with error');
                log.error(err);
            }
        );
};
