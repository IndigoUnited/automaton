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
        exit.call(process, 1);
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
    // run message arrived?
    if (data.msg === 'run') {
        var task = data.task,
            initConfig = {},
            gruntConfig = task.config || {},
            multi = grunt.task._tasks[task.name].multi;

        // prepare the config
        task.opts = task.opts || {};
        initConfig[task.name] = multi ? { automaton: task.opts } : task.opts;
        gruntConfig.config = __dirname + '/gruntfile';
        gruntConfig.base = gruntConfig.base || process.cwd();

        // run the task using grunt
        grunt.initConfig(initConfig);
        grunt.tasks([task.name], gruntConfig, function () {
            process.send({ msg: 'finished', code: 0 });
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
    var err;

    if (code) {
        // throw an error to kill the call stack
        // this is needed because code bellow `process.exit` cannot be run
        err = new Error('finished');
        err.code = code;
        throw err;
    } else {
        exit.call(process);
    }
};

// caught self thrown exceptions and inform the parent
process.on('uncaughtException', function (e) {
    if (e.message === 'finished') {
        process.send({ msg: 'finished', code: e.code });
    } else {
        throw e;
    }
});

// inform that the worker is ready!
process.nextTick(function () {
    resetKeepAlive();
    process.send({ msg: 'inited' });
});