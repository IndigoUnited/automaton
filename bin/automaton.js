#!/usr/bin/env node
var util    = require('util'),
    utils   = require('amd-utils'),
    fs      = require('fs'),
    colors  = require('colors'),
    path    = require('path'),
    argv    = require('optimist').argv,
    pkg     = require('../package.json')
;

// set up a useful set of formats
colors.setTheme({
    input:   'grey',
    info:    'green',
    data:    'grey',
    help:    'cyan',
    warning: 'yellow',
    debug:   'blue',
    error:   'red'
});

function inspect(v, levels) {
    levels = levels || 10;
    console.log(util.inspect(v, false, levels, true));
}

// ----------------------------- USAGE PARAMETERS ------------------------------

var firstColumnWidth = 20,
    commands = [
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
            opt: '--task-dir, -d',
            desc: 'Task include dir. All the tasks within the folder will be loaded.'
        },
        {
            // TODO:
            opt: '--verbosity, -V [depth]',
            desc: 'Set the verbosity depth. Defaults to 1, and stands for how deep the feedback should go.'
        },
        {
            opt: '--version, -v',
            desc: 'Get version'
        }
    ]
;

// ---------------------------------- BOOT -------------------------------------

// load automaton
var automaton = require(__dirname + '/../index');

// if task directory includes were defined, load the tasks
var taskDir = (argv['task-dir'] !== true ? argv['task-dir'] : false) || (argv.d !== true ? argv.d : false);
if (taskDir) {
    // if task dir exists, load tasks
    if (fs.existsSync(taskDir) && fs.statSync(taskDir).isDirectory()) {
        automaton.loadTasks(taskDir);
    }
}

// if verbosity was defined, set it
var verbosity = (argv.verbosity !== true ? argv.verbosity : false) || (argv.V !== true ? argv.V : false);
if (verbosity) {
    automaton.setVerbosity(verbosity);
}

// --------------- CHECK WHAT THE USER REQUESTED, AND ACT ON IT ----------------

// if version was requested, just show version and quit
if (argv.version || argv.v) {
    console.log('Automaton'.cyan, ('v' + pkg.version).info);
    console.log('Indigo United 2012'.cyan);
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
            console.error(('\nCould not find any task or autofile "' + taskId + '"\n').error);
        }
    }
    // no task was specified, show overall usage
    else {
        showUsage();
    }

    process.exit();
}

// if a command was specified, run it
if (argv._.length) {
    switch (argv._[0]) {
    case 'init':
        initTask(argv._[1]);
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
                console.error(('\nCould not find any task or autofile "' + taskId + '"\n').error);
                process.exit(1);
            }
        }

        // run the task
        //runTask(task, getTaskOptFromArgv(task));
        runTask(task, argv);
    }
}
// no command was specified, try to run autofile.js in the cwd
else {
    var task = getTaskFromFile();

    //runTask(task, getTaskOptFromArgv(task));
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
    }, 0) + 4;

    for (i = 0; i < totalCommands; ++i) {
        cmd = commands[i];
        console.log(utils.string.rpad('  ' + cmd.cmd, firstColumnWidth).grey + ' ' + cmd.desc);
    }

    console.log('\n  Options:\n');
    firstColumnWidth = automatonOptions.reduce(function (prev, curr) {
        if (curr.opt.length > prev) {
            return curr.opt.length;
        }

        return prev;
    }, 0) + 4;
    for (i = 0; i < totalOptions; ++i) {
        opt = automatonOptions[i];
        console.log(utils.string.rpad('  ' + opt.opt, firstColumnWidth).grey + ' ' + opt.desc);
    }
    
    console.log('');
}

function showTaskUsage(task) {
    var optionName,
        option
    ;

    console.log('\n  Usage: ' + argv.$0.cyan, task.id, '[--option1 value1 --option2 value2]'.grey);
    console.log('\n  Options:\n');

    if (task.options) {
        firstColumnWidth = utils.array.max(utils.object.keys(task.options), function (v) {
            return v.length;
        }).length + 6;

        for (optionName in task.options) {
            option = task.options[optionName];
            console.log(utils.string.rpad('    ' + optionName + (option.hasOwnProperty('default') ? (' (' + option['default'] + ')') : ''), firstColumnWidth).grey + option.description);
        }
    }
    
    console.log('');
}

function initTask(taskId) {
    console.log('initing', taskId);
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

    automaton.run(task, options);
}