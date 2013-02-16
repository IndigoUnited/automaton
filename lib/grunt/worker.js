'use strict';

var glob  = require('glob');
var grunt;

// attempt to require grunt (first local, then global)
try {
    grunt = require(process.cwd() + '/node_modules/grunt/lib/grunt');
} catch (e) {
    try {
        grunt = require('grunt');
    } catch (e) {
        process.send({ msg: 'error', data: 'Unable to find grunt, please install it locally or globally' });
        process.exit(1);
    }
}

var npmTasks,
    keepAliveTimeout = Number(process.argv[2]),
    keepAliveTimeoutId,
    exit = process.exit,
    running = false;

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

// do some monkey patching because grunt calls process.exit()
// as long as nodejs allows to monkey patch process.exit, the code bellow is valid
// otherwise we would need to monkey patch grunt.fail in order to prevent calls to process.exit()
process.stdout.write = function (str) {
    process.send({ msg: 'log', data: str });
};
process.exit = function (code) {
    if (code && running) {
        // throw an error to kill the call stack
        // this is needed because code bellow `process.exit` cannot be run
        // note that this error will be caught bellow with process.on('uncaughtException')
        throw new Error('automaton_task_failed');
    }

    exit.call(process);
};
process.on('uncaughtException', function (err) {
    var wasRunning = running;
    running = false;

    // mark grunt as not running (this is very important)
    grunt.task._running = false;

    // caught self thrown exceptions and inform the parent
    // otherwise its some other exception
    if (wasRunning) {
        if (err.message === 'automaton_task_failed') {
            process.send({ msg: 'end', error: 'Failed to run grunt task' });
        } else {
            process.send({ msg: 'end', error: 'Failed to run grunt task: ' + err.message });
        }
    } else {
        process.send({ msg: 'error', data: err.message });
    }
});

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
    // we need to handle the message in the next tick
    // this is needed because if the code bellow throws an error
    // the message wasn't being removed from the stack, causing it to be processed again
    // this sounds like a node bug
    process.nextTick(function () {
        // run message arrived?
        if (data.msg === 'run') {
            if (running) {
                return process.send({ msg: 'error', data: 'Another task is already running' });
            }

            var task = data.task,
                initConfig = {},
                gruntConfig = task.config || {},
                taskDef;

            // prepare the config
            task.opts = task.opts || {};
            gruntConfig.config = __dirname + '/gruntfile';
            gruntConfig.base = gruntConfig.base || process.cwd();
            if (typeof gruntConfig.tasks === 'string') {  // attempt to fix bad usage of tasks option
                gruntConfig.tasks = [gruntConfig.tasks];
            }

            // force grunt to initialize and load tasks specified in the "tasks" config
            grunt.option.init(gruntConfig);
            grunt.task.init([]);

            // check if the task is loaded
            taskDef = grunt.task._tasks[task.name];
            if (!taskDef) {
                return process.send({ msg: 'end', error: 'Task "' + task.name + '" not loaded, either install it or specify its directory in the "tasks" grunt config' });
            }

            // set task options in the init config
            initConfig[task.name] = taskDef.multi ? { automaton: task.opts } : task.opts;

            // run the task using grunt
            running = true;
            grunt.initConfig(initConfig);
            grunt.tasks([task.name], gruntConfig, function () {
                running = false;
                process.send({ msg: 'end' });
            });
        // keep alive message arrive?
        } else if (data.msg === 'keep-alive') {
            resetKeepAlive();
        }
    });
});

// inform that the worker is ready!
process.nextTick(function () {
    resetKeepAlive();
    process.send({ msg: 'init' });
});