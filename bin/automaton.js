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

/*
Options:
TODO:
  - task dir
  - verbosity
  - help
  - version

*/

var firstColumnWidth = 25,
    commands = [
        {
            cmd: '[autofile]',
            desc: 'Run an autofile. Defaults to "autofile.js"'
        },
        {
            cmd: 'init [autofile]',
            desc: 'Create a blank autofile. Defaults to "autofile.js"'
        },
        {
            cmd: 'help [task]',
            desc: 'Get the usage. Specify a task to get the usage of that specific task'
        },
        {
            cmd: '--version, -v',
            desc: 'Get version'
        }
    ]
;

// ---------------------------------- BOOT -------------------------------------

// load automaton
var automaton = require(__dirname + '/../index');

// if task directory includes were defined, load the tasks
if (argv['task-dir']) {
    var taskDir = argv['task-dir'];
    // if task dir exists, load tasks
    if (fs.existsSync(taskDir) && fs.statSync(taskDir).isDirectory()) {
        automaton.loadTasks(taskDir);
    }
}

// --------------- CHECK WHAT THE USER REQUESTED, AND ACT ON IT ----------------

// if version was requested, just show version and quit
if (argv.version || argv.v) {
    console.log('Automaton'.cyan, ('v' + pkg.version).info);
    console.log('Indigo United 2012'.cyan);
    process.exit();
}

// if help was requested by option, just show the usage
if (argv.help || argv.h) {
    showUsage();
    process.exit();
}

// if a command was specified, run it
if (argv._.length) {
    switch (argv._[0]) {
    case 'init':
        initTask(argv._[1]);
        break;

    case 'help':
        // if a task was specified, show the task usage
        if ((argv._[1])) {
            var taskId = argv._[1],
                task
            ;

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
        runTask(task, getTaskOptFromArgv(task));
    }
}
// no command was specified, try to run autofile.js in the cwd
else {
    var task = getTaskFromFile();

    runTask(task, getTaskOptFromArgv(task));
}



// ---------------------------- HELPER FUNCTIONS -------------------------------


function showUsage() {
    var i,
        totalCommands = commands.length,
        cmd;

    console.log('\n  Usage: ' + argv.$0.cyan, '[command]', '[options]\n'.grey);

    for (i = 0; i < totalCommands; ++i) {
        cmd = commands[i];
        console.log(utils.string.rpad('  ' + cmd.cmd, firstColumnWidth).grey + ' ' + cmd.desc);
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
        for (optionName in task.options) {
            option = task.options[optionName];
            console.log(utils.string.rpad('    ' + optionName + (option.hasOwnProperty('default') ? (' (' + option['default'] + ')') : ''), firstColumnWidth).grey + ' ' + option.description);
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

function getTaskOptFromArgv(task) {
    var optionName,
        option,
        finalOptions = {},
        optionValue
    ;

    if (task.options) {
        for (optionName in task.options) {
            option = task.options[optionName];

            optionValue = argv[optionName] || option['default'];

            if (optionValue !== undefined) {
                finalOptions[optionName] = optionValue;
            }
        }
    }

    return finalOptions;
}
