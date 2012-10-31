var task = {
    // this id must be unique, and is not mandatory, unless you want to
    // load this task and use it in other tasks
    id: 'example_task',

    // a user friendly name, just for reference, not mandatory
    name: 'Example task',

    // also not mandatory
    author: 'Indigo United',

    // filter is not mandatory, and can be used to perform some operation
    // on the options before running the subtasks
    filter: function (options) {
        // you can change existing options
        options.dir2 = options.dir2 + '_indigo';

        // and even define additional options, in this case we're defining
        // a `dir3` option, which will be used by one of the subtasks
        options.dir3 = 'united';
    },

    // this is also optional, but useful if you want the automaton
    // to automatically check for required options, and some additional
    // features, check below
    options: {
        dir1: {
            // option description is not mandatory
            description : 'The name of the folder that will hold all the subfolders'
        },
        dir2: {
            // this option will not be required, since it has a default value
            'default': 'automaton'
        }
    },

    // a list of subtasks that will run when the example_task runs
    tasks: [
        {
            task: 'mkdir',
            description: 'create the root and second folder',
            options: {
                // the option below will have its placeholders replaced by
                // the value that it receives
                dir: '{{dir1}}/{{dir2}}'
            }
        },
        {
            task: 'mkdir',
            description: 'create the third folder, which was defined by one of the filters',
            options: {
                dir: '{{dir1}}/{{dir2}}/{{dir3}}'
            }
        }
    ]
};

module.exports = task;
