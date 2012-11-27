#!/usr/bin/env node
var util    = require('util'),
    fs      = require('fs'),
    colors  = require('colors'),
    path    = require('path'),
    program = require('commander'),
    pkg     = require('../package.json')
;

var inspect = function (v, levels) {
    levels = levels || 10;
    console.log(util.inspect(v, false, levels, true));
};

// load automaton
var automaton = require(__dirname + '/../index');





function runAutofile(file) {
    var autofile = path.resolve(process.cwd(), file || 'autofile.js');

    // add ".js" if it is not there
    if (!/\.js/i.test(autofile)) {
        autofile = autofile + '.js';
    }

    if (!fs.existsSync(autofile)) {
        console.log('Could not find autofile: '.error + autofile);
        process.exit(1);
    }

//    console.log('Running', autofile);

    autofile = require(autofile);


    // TODO: pass any option to the task that was provided as a CLI arg
    automaton.run(autofile);
}








program
    .version(pkg.version)
    .option('-v, --verbosity <level>', 'The verbosity level specifies how deep the tasks output will be shown (defaults to 1)', parseInt, 1)
;

program
    .command('*')
    .description('Run an autofile')
    .action(runAutofile);

program
    .command('init [name]')
    .description('Create a blank autofile')
    .action(function (name) {
        name = name || 'autofile';

        console.log('initializing');

        automaton.run({
            'tasks': [
                {
                    'task': 'task-init',
                    'options': {
                        'name': name
                    }
                }
            ]
        });
    })
;

program
    .command('usage [task]')
    .description('Check the usage of a specific task')
    .action(function (task) {

        console.log('Checking usage of', task);
    })
;



automaton.setVerbosity(program.verbosity);

// if some arguments were passed, parse the command
if (process.argv.length > 2) {
    program.parse(process.argv);
}
// no arguments passed, try to run the default autofile
else {
    runAutofile();
}


