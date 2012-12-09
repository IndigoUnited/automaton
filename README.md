Automaton
=========

Task automation tool built in JavaScript.

[![Build Status](https://secure.travis-ci.org/IndigoUnited/automaton.png)](http://travis-ci.org/IndigoUnited/automaton)

![Automaton](http://indigounited.github.com/automaton/img/stamp.png)

## Why?

You often find yourself needing to do some repetitive operation, and this is usually the time to quickly bake some ad-hoc script. Still, from project to project you find yourself needing to reuse some task you had already previously created.

Automaton eases this process, allowing you to quickly set up an `autofile`, which describes what you want to do, by means of an ordered list of tasks that need to run for the task as a whole to be complete.

A little detail that makes Automaton a powerful tool, is that every `autofile` you create can itself be used by another `autofile`, turning the first one into a single task (imagine boxes within boxes). If you are curious, you can take a look at the source code, and check for yourself that even the tasks that Automaton provides built-in are simple `autofiles`.


## Installing

You can simply install Automaton through NPM, by running `npm install -g automaton`. This will install Automaton globally, and you will be able to execute `automaton` in your terminal.


## Creating a task

An automaton task is a simple object, describing what the task will do.

For illustration purposes, here's a simple `autofile` that just creates a folder and copies a file into it:

```javascript
var myTask = {
    tasks: [
        {
            task: 'mkdir',
            description: 'create the project root folder',
            options: {
                dir: 'some_dir'
            }
        },
        {
            task: 'cp',
            description: 'copy some file',
            options: {
                src: 'some_file',
                dst: 'some_dir/dest_file'
            }
        }
    ]
};

module.exports = myTask;
```

To illustrate most of the capabilities of Automaton, here's a complete `autofile` with comments along the file:

```javascript
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

    // Filter is not mandatory,
    // but can be used to perform some operation
    // on the options before running the subtasks
    filter: function (options, next) {
        // You can change existing options
        options.dir2 = options.dir2 + '_indigo';

        // and even define additional options.
        // In this case we're defining
        // a `dir3` option,
        // which will be used by one of the subtasks
        options.dir3 = 'united';

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
            'default': 'automaton'
        },
        // This option is used below, for skipping
        // subtasks.
        run_all: {
            'default': false
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
            // Description messages can be generated according to the options
            // by using a function instead of a static description
            description: function (opt) {
                return 'Creating ' + opt.dir1 + '/' + opt.dir2 + '/' + opt.dir3
            },
            options: {
                dir: '{{dir1}}/{{dir2}}/{{dir3}}'
            }
        },
        {
            // if you find yourself looking
            // for something a bit more custom,
            // you can just provide a function as the task
            task : function (opt, next) {
                // opt is a list of the options
                // provided to the task

                console.log('I can do whatever I want', opt);

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
```

Please note that placeholders can be escaped with backslashes:
`'\\{\\{dir1\\}\\}'`

## Built-in tasks

`automaton` comes bundled with a few tasks to ease your own tasks.

`ROADMAP` Note that we're working to have support for `gruntjs` tasks, so you can use them just as you would with native `automaton` tasks.

### Filesystem

- **chmod:** Change mode of files
- **cp:** Copy files and directories
- **mkdir:** Make directories recursively
- **rm:** Remove several files or directories
- **symlink:** Create symlink


### Scaffolding

Scaffolding tasks help you perform some typical tasks, like appending, replacing, and others, to placeholders in a template file. Any text file can be a template. These tasks will look for a `{{placeholder_name}}` inside the file, and perform the option you specified on it.

- **scaffolding-append:** Append something to a placeholder in a file
- **scaffolding-replace:** Replace the placeholder with something
- **scaffolding-close:** Close the placeholder (effectively removing the placeholder)
- **scafolding-file-rename:** Rename files, replacing placeholders within directories

### Miscellaneous

- **run:** Run a shell command
- uglify (soon)
- minify (soon)
- concat (soon)

### Inline functions

If you find yourself trying to do something that is not supported by the existing tasks, you can just provide a function, instead of the task name, and it will be used as the task.

This task will receive 2 arguments, an options object (the options that were provided to the subtask), and a callback that must be called once the subtask is over, giving you full flexibility, since your function can do whatever you like.


## Usage

### CLI

All you need to use the CLI can be found by executing `automaton -h`. This will show you how to use `automaton`, and any of the loaded tasks.

In order to run an `autofile`, you simply run `automaton`. This will look for `autofile.js` in the current working dir. Instead, you can also run `automaton some_dir/my_autofile.js`, enabling you to specify what `autofile` you want to run.

### Node.js

Automaton can also be used as a node module. Here's a quick example of its usage:

```javascript
var automaton = require('automaton');

// Since autofiles are node modules themselves,
// you can just require them
// Note that you could have instead declared
// the module inline, in JSON
var myTask = require('my_autofile');

automaton.run(myTask, { 'some_option': 'that is handy' });
```

## Acknowledgements

Should be noted that this tool was inspired by already existing tools, and you should definitely take a look at them before deciding what is the right tool for the job at hand:

- [Initializr](http://www.initializr.com/), by [Jonathan Verrecchia](https://twitter.com/verekia)
- [Gruntjs](http://gruntjs.com/), by [Ben Alman](https://twitter.com/cowboy)

To these guys, a big thanks for their work.


## Contributing

Should be noted that Automaton is an open source project, and also work in progress. Feel free to contribute to the project, either with questions, ideas, or solutions. Don't forget to check out the issues page, as there are some improvements planned.

Thanks, and happy automation!


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
