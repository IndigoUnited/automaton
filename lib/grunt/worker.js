'use strict';

var grunt = require('grunt');
var glob  = require('glob');

var npmTasks,
    keepAliveTimeout = Number(process.argv[2]),
    keepAliveTimeoutId,
    exit = process.exit;

// function to reset the keep alive timeout
// once a keep alive message from the parent is received
function resetKeepAlive() {
    if (keepAliveTimeoutId) {
        clearTimeout(keepAliveTimeoutId);
    }

    keepAliveTimeoutId = setTimeout(function () {
        exit(1);
    }, keepAliveTimeout);
}

// auto-load npm tasks
npmTasks = glob.sync('./grunt-*', { cwd: 'node_modules', mark : true });
npmTasks.forEach(function (npmTask) {
    if (/[\/\\]$/.test(npmTask)) {
        grunt.loadNpmTasks(npmTask.slice(2, -1));
    }
});

// auto-load local tasks
grunt.loadTasks('./tasks');

// handle parent messages
process.on('message', function (data) {
    // exit message arrived?
    if (data.msg === 'exit') {
        return exit();
    // run message arrived?
    } else if (data.msg === 'run') {
        var task = data.task,
            initConfig = {},
            gruntConfig = data.config || {};

        // load the task if its directory was specified
        if (data.taskDir) {
            grunt.loadTasks(data.taskDir);
        }

        // prepare the config
        initConfig[task.name] = task.opts || {};
        gruntConfig.config = __dirname + '/gruntfile';

        // run the task using grunt
        grunt.initConfig(initConfig);
        grunt.tasks([task.name], gruntConfig, function () {
            process.send({ msg: 'runned', code: 0 });
        });
    // keep alive message arrive?
    } else if (data.msg === 'keep-alive') {
        resetKeepAlive();
    }
});

// do some monkey patching because grunt calls process.exit()
// as long as nodejs allows to monkey patch process.exit, the code bellow is valid
// otherwise we would need to monkey patch grunt.fail in order to prevent calls to process.exit()
process.stdout.write = function (str) {
    process.send({ msg: 'write', data: str });
};
process.exit = function (code) {
    if (code) {
        process.send({ msg: 'runned', code: code });
    } else {
        exit();
    }
};

// inform that the worker is ready!
process.nextTick(function () {
    resetKeepAlive();
    process.send({ msg: 'inited' });
});