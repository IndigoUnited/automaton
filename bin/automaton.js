#!/usr/bin/env node
var utils     = require('amd-utils'),
    fs        = require('fs'),
    path      = require('path'),
    argv      = require('optimist').argv,
    pkg       = require('../package.json'),
    Automaton = require('../index')
;

// ----------------------------- USAGE PARAMETERS ------------------------------

var commands = [
        {
            cmd: '[autofile]',
            desc: 'Run an autofile. Defaults to "autofile.js".'
        },
        {
            cmd: 'init [autofile]',
            desc: 'Create a blank autofile. Defaults to "autofile.js".'
        }
    ],
    automatonOptions = [
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
            desc: 'Set the verbosity depth. Defaults to 1, and stands for how deep the feedback should go.'
        },
        {
            opt: '--version, -v',
            desc: 'Get version'
        }
    ]
;

// ---------------------------------- BOOT -------------------------------------

// set up the options to pass to the automaton
var options = {
    debug: !!(argv.debug || argv.D)
};

// only process the verbosity if set
if (argv.verbosity != null || argv.V != null) {
    options.verbosity = parseInt(argv.verbosity != null ? argv.verbosity : argv.V, 10);
}

var automaton;
try {
    automaton = new Automaton(options);
} catch (e) {
    automaton.getLogger().errorln(e.message);
    process.exit(1);
}

// if task directory includes were defined, load the tasks
var taskDir = (utils.lang.isString(argv['task-dir']) ? argv['task-dir'] : null) || (utils.lang.isString(argv.d) ? argv.d : null);
if (taskDir) {
    // if task dir exists, load tasks
    if (fs.existsSync(taskDir) && fs.statSync(taskDir).isDirectory()) {
        try {
            automaton.loadTasks(taskDir);
        } catch (e) {
            automaton.getLogger().errorln(e.message);
            process.exit(1);
        }
    }
}

// --------------- CHECK WHAT THE USER REQUESTED, AND ACT ON IT ----------------

// if version was requested, just show version and quit
if (argv.version || argv.v) {
    console.log(pkg.version);
    process.exit();
}

// if help was requested, just show the usage
if (argv.help || argv.h) {
    var taskId = (argv.help === true ? false : argv.help) || (argv.h === true ? false : argv.h),
        task
    ;

    // if a task was specified, show the task usage
    if (taskId) {
        // if there is no autofile in the current directory
        // with that name, check if there is a task suitable
        if (!(task = getTaskFromFile(taskId))) {
            task = automaton.getTask(taskId);
        }

        // try to show usage
        try {
            showTaskUsage(task);
        // unknown task requested
        } catch (err) {
            console.error(('Could not find any task or autofile "' + taskId + '"\n').error);
        }
    // no task was specified, show overall usage
    } else {
        showUsage();
    }

    process.exit();
}

// if a command was specified, run it
if (argv._.length) {
    switch (argv._[0]) {
    case 'init':
        var taskId = argv._[1] || 'autofile';
        initTask(taskId);
        break;

    default:
        // either got a task id, an autofile name, or an invalid parameter
        var taskId = argv._[0];

        // if there is no autofile in the current directory
        // with that name, check if there is a task suitable
        if (!(task = getTaskFromFile(taskId))) {
            try {
                task = automaton.getTask(taskId);
            } catch (err) {
                console.error(('Could not find any task or autofile "' + taskId + '"\n').error);
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
        process.exit();
    }

    runTask(task, argv);
}



// ---------------------------- HELPER FUNCTIONS -------------------------------


function showUsage() {
    var i,
        totalCommands = commands.length,
        totalOptions = automatonOptions.length,
        cmd,
        opt,
        firstColumnWidth;

    console.log('\n  Usage: ' + argv.$0.cyan, '[command]', '[options]'.grey);

    console.log('\n  Commands:\n');
    firstColumnWidth = commands.reduce(function (prev, curr) {
        if (curr.cmd.length > prev) {
            return curr.cmd.length;
        }

        return prev;
    }, 0) + 6;

    for (i = 0; i < totalCommands; ++i) {
        cmd = commands[i];
        console.log(utils.string.rpad('    ' + cmd.cmd, firstColumnWidth).grey + cmd.desc);
    }

    console.log('\n  Options:\n');
    firstColumnWidth = automatonOptions.reduce(function (prev, curr) {
        if (curr.opt.length > prev) {
            return curr.opt.length;
        }

        return prev;
    }, 0);

    firstColumnWidth += 6;

    for (i = 0; i < totalOptions; ++i) {
        opt = automatonOptions[i];
        console.log(utils.string.rpad('    ' + opt.opt, firstColumnWidth).grey + opt.desc);
    }

    console.log('');
}

function showTaskUsage(task) {
    var optionName,
        option,
        leftCol,
        usage = [],
        k
    ;

    console.log('\n  Usage: ' + argv.$0.cyan, task.id, '[--option1 value1 --option2 value2]'.grey);
    console.log('\n  Options:\n');

    var firstColumnWidth = 0;

    if (task.options) {
        for (optionName in task.options) {
            option = task.options[optionName];
            leftCol = optionName + (option['default'] !== undefined ? ' (' + option['default'] + ')' : '');
            usage.push({
                opt:  leftCol,
                desc: option.description
            });

            if (leftCol.length > firstColumnWidth) {
                firstColumnWidth = leftCol.length;
            }
        }

        firstColumnWidth += 6;

        for (k in usage) {
            console.log(utils.string.rpad('    ' + usage[k].opt, firstColumnWidth).grey + (usage[k].desc ? usage[k].desc : ''));
        }
    }

    console.log('');
}

function initTask(taskId) {
    runTask('init', {
        'name': taskId
    }, function (err) {
        if (err) {
            console.error(('Unable to create task\n').error);
            process.exit(1);
        }

        console.log('Task initialized'.green);
    });
}

function getTaskFromFile(file) {
    var autofile = path.resolve(process.cwd(), file || 'autofile.js');

    // add ".js" if it is not there
    if (!/\.js/i.test(autofile)) {
        autofile = autofile + '.js';
    }

    if (!fs.existsSync(autofile)) {
        return false;
    }

    return require(autofile);
}

function runTask(task, options) {
    if (utils.lang.isString(task)) {
        task = automaton.getTask(task);
    }

    automaton
        .run(task, options, function (err) {
            process.exit(err ? 1 : 0);
        })
        .pipe(process.stdout);
}