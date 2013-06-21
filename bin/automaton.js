#!/usr/bin/env node

'use strict';

var mout           = require('mout');
var fs             = require('fs');
var path           = require('path');
var argv           = require('optimist').argv;
var pkg            = require('../package.json');
var updateNotifier = require('update-notifier');
var validate       = require('../lib/TaskBuilder').validateTask;
var Automaton      = require('../index');
var Tabular        = require('tabular');
var notifier;

// ----------------------------- USAGE PARAMETERS ------------------------------

var commands = [
    {
        cmd: '[autofile]',
        desc: 'Run an autofile. Defaults to "autofile.js".'
    },
    {
        cmd: 'init [autofile]',
        desc: 'Create a blank autofile. Defaults to "autofile.js".'
    },
    {
        cmd: 'find [some task]',
        desc: 'Find tasks on NPM registry. Option --grunt also includes grunt tasks in result. Force the cache to update with --clear-cache.'
    }
];

var automatonOptions = [
    {
        opt: '--help, -h [task]',
        desc: 'Get help. If you specify a task, you\'ll be given the task usage.'
    },
    {
        opt: '--task-dir, -d <dir>',
        desc: 'Task include dir. All the tasks within the folder will be loaded.'
    },
    {
        opt: '--verbosity, -V <depth>',
        desc: 'Set the verbosity depth. Defaults to 1, and stands for how deep the feedback should go.'
    },
    {
        opt: '--debug, -D',
        desc: 'Enables debug mode'
    },
    {
        opt: '--no-color',
        desc: 'Disable colors'
    },
    {
        opt: '--version, -v',
        desc: 'Get version'
    }
];

// ---------------------------------- BOOT -------------------------------------

// set up the options to pass to the automaton
var options = {
    debug: !!(argv.debug || argv.D)
};

// only process the color if set
if (argv.color != null) {
    options.color = !!argv.color;
}

// only process the verbosity if set
if (argv.verbosity != null || argv.V != null) {
    options.verbosity = parseInt(argv.verbosity != null ? argv.verbosity : argv.V, 10);
}

var automaton;
try {
    automaton = new Automaton(options);
} catch (e) {
    console.error(e.message.automaton_error);
    process.exit(1);
}

// if task directory includes were defined, load the tasks
var taskDir = (mout.lang.isString(argv['task-dir']) ? argv['task-dir'] : null) || (mout.lang.isString(argv.d) ? argv.d : null);
var loadTaskErrors;
if (taskDir) {
    // if task dir exists, load tasks
    if (fs.existsSync(taskDir) && fs.statSync(taskDir).isDirectory()) {
        loadTaskErrors = automaton.loadTasks(taskDir);
        loadTaskErrors.forEach(function (err) {
            console.error(err.message.automaton_error);
        });
    }
}

// --------------- CHECK WHAT THE USER REQUESTED, AND ACT ON IT ----------------

// if version was requested, just show version and quit
if (argv.version || argv.v) {
    console.log(pkg.version);
    process.exit();
}


// Check if there's an update
notifier = updateNotifier({
    packagePath: '../package'
});

if (notifier.update) {
    // Notify using the built-in convenience method
    notifier.notify();
}

// if help was requested, just show the usage
if (argv.help || argv.h) {
    var help = argv.h || argv.help,
        taskId = argv._[0] || (help === true ? false :  help),
        task
    ;

    // if a task was specified, show the task usage
    if (taskId) {
        // if there is no autofile in the current directory
        // with that name, check if there is a task suitable
        if (!(task = getTaskFromFile(taskId))) {
            task = automaton.getTask(taskId);
            if (!task) {
                console.error(('Could not find any task or autofile "' + taskId + '"').automaton_error);
                process.exit(1);
            }
        }

        // try to show usage
        try {
            showTaskUsage(task);
        // unknown task requested
        } catch (err) {
            console.error(err.message.automaton_error);
            process.exit();
        }
    // no task was specified, show overall usage
    } else {
        showUsage();
    }
}

// if a command was specified, run it
else if (argv._.length) {
    switch (argv._[0]) {
    case 'init':
        var taskId = argv._[1] || 'autofile';
        initTask(taskId);
        break;

    case 'find':
        argv.query = argv._[1];
        runTask(require('automaton-find-task'), argv);
        break;

    default:
        // either got a task id, an autofile name, or an invalid parameter
        var taskId = argv._[0];

        // if there is no autofile in the current directory
        // with that name, check if there is a task suitable
        if (!(task = getTaskFromFile(taskId))) {
            task = automaton.getTask(taskId);
            if (!task) {
                console.error(('Could not find any task or autofile "' + taskId + '"').automaton_error);
                process.exit(1);
            }
        }

        // run the task
        runTask(task, argv);
    }
// no command was specified, try to run autofile.js in the cwd
} else {
    var task = getTaskFromFile();

    if (!task) {
        showUsage();
    } else {
        runTask(task, argv);
    }
}

// ---------------------------- HELPER FUNCTIONS -------------------------------

function showUsage() {
    console.log('\n  Usage: ' + argv.$0.cyan, '[command]', '[options]'.grey);

    showCommands();
    showTasks();
    showOptions();

    console.log('');
}

function showCommands() {
    var tab = getTab();
    var i, totalCommands = commands.length, cmd;

    console.log('\n  Commands:\n');

    for (i = 0; i < totalCommands; i++) {
        cmd = commands[i];
        tab.push([cmd.cmd.grey, cmd.desc]);
    }

    console.log(tab.get());
}

function showOptions() {
    var i;
    var tab = getTab();
    var totalOptions = automatonOptions.length, opt;

    console.log('\n  Options:\n');

    for (i = 0; i < totalOptions; ++i) {
        opt = automatonOptions[i];
        tab.push([opt.opt.grey, opt.desc]);
    }

    console.log(tab.get());
}

function showTasks() {
    var i;
    var tasks = automaton.getTasks();
    var tab = getTab();

    console.log('\n  Tasks:\n');

    // create list of tasks
    for (i in tasks) {
        if (tasks[i].id) {
            tab.push([tasks[i].id.grey, tasks[i].description]);
        }
    }

    console.log(tab.sort().get());
}

function showTaskUsage(task) {
    var optionName;
    var option;
    var leftCol;
    var tab = getTab();

    validate(task);

    if (task.description) {
        console.log('\n  ' + task.description.green);
    }

    console.log('\n  Usage: ' + argv.$0.cyan, task.id, '[--option1 value1 --option2 value2]'.grey);
    console.log('\n  Options:\n');

    if (task.options) {
        for (optionName in task.options) {
            option = task.options[optionName];
            leftCol = optionName + (option['default'] !== undefined ? ' (' + option['default'] + ')' : '');
            tab.push([leftCol.grey, option.description]);
        }

        console.log(tab.sort().get());
    }

    console.log('');
}

function initTask(taskId) {
    runTask('init', {
        'name': taskId
    }, function (err) {
        if (err) {
            console.error('Unable to create task'.automaton_error);
            process.exit(1);
        }

        console.log('Task initialized'.green);
    });
}

function getTaskFromFile(file) {
    var autofile = path.resolve(process.cwd(), file || 'autofile.js');

    // add ".js" if it is not there
    if (!/\.js$/i.test(autofile)) {
        autofile = autofile + '.js';
    }

    if (!fs.existsSync(autofile)) {
        return false;
    }

    try {
        return Automaton.getTaskDefinition(require(autofile));
    } catch (e) {
        console.error(e.message.automaton_error);
        process.exit(1);
    }
}

function runTask(task, taskOpts) {
    automaton
    .run(task, taskOpts, function (err) {
        if (err) {
            // if debug is on, throw the error (to make the stack visible)
            if (options.debug) {
                throw err;
            }
            process.exit(1);
        }
    })
    .pipe(process.stdout);
}

function getTab() {
    return new Tabular({
        padding: 2,
        marginLeft: 4
    });
}
