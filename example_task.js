/*jshint es5:true*/

'use strict';

var task = {
    // This id is not mandatory but,
    // if you want to use this task in other tasks,
    // must be provided and unique
    id: 'example_task',

    // A user friendly name,
    // just for reference, not mandatory
    name: 'Example task',

    // also not mandatory
    author: 'Indigo United',

    // Setup is not mandatory,
    // but can be used to perform some operation
    // before running the subtasks (e.g.: change options)
    setup: function (options, ctx, next) {
        // You can change existing options
        options.dir2 = options.dir2 + '_indigo';

        // and even define additional options.
        // In this case we're defining
        // a `dir3` option,
        // which will be used by one of the subtasks
        options.dir3 = 'united';

        // Call next when done with the setup
        next();
    },

    // This is also optional,
    // but useful if you want the automaton
    // to automatically check for required options,
    // and some additional features, check below
    options: {
        dir1: {
            // Option description is not mandatory
            description : 'The name of the folder ' +
                          'that will hold ' +
                          'all the subfolders'
        },
        dir2: {
            // This option will not be required,
            // since it has a default value.
            // Check the second subtask.
            default: 'automaton'
        },
        // This option is used below, for skipping
        // subtasks.
        run_all: {
            default: false
        }
    },

    // A list of subtasks that will run
    // when the example_task runs
    tasks: [
        {
            task: 'mkdir',
            description: 'create the root and second folder',
            options: {
                // the option below
                // will have its placeholders replaced by
                // the value that it receives
                dir: '{{dir1}}/{{dir2}}'
            }
        },
        {
            task: 'mkdir',
            // This 'on' attributes allows you to
            // enable/disable a subtask just by setting it
            // to a falsy value.
            // In this case, we even used a placeholder,
            // allowing us to skip this subtask depending
            // on the run_all option. Of course, you have
            // just setted it to something like `false`
            on: '{{run_all}}',
            description: 'create the third folder, ' +
                         'which was defined ' +
                         'by the setup',
            options: {
                dir: '{{dir1}}/{{dir2}}/{{dir3}}'
            }
        },
        {
            // if you find yourself looking
            // for something a bit more custom,
            // you can just provide a function as the task
            task : function (opt, ctx, next) {
                // opt is a list of the options
                // provided to the task

                ctx.log.infoln('I can do whatever I want.',
                    'Here\'s the list of options\n', opt);

                // when the task is done,
                // you just call next(),
                // not like the MTV show, though…
                // (- -')
                next();
            }
        }
    ]
};

module.exports = task;