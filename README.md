Automaton
=========

Task automation tool built in JavaScript.


## Why?

Many times you find yourself needing to do some repetitive operation, and this is usually the time to quickly bake some script does that. Still, from project to project you find yourself needing to reuse some task you had already previously created. Automaton eases this process, allowing you to quickly set up an `autofile`, which describes what you want to do, by means of a list of tasks that need to run, in order, for the task as a whole to be done.

A little detail that makes Automaton a powerful tool, is that every `autofile` you create can itself be used by another `autofile`, turning the first one into a single task (imagine tasks are boxes, and you can have boxes within boxes). If you are curious, you can take a look at the source code, and check for yourself that even the tasks that Automaton provides built-in are themselves `autofiles`.


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
    // this id is not mandatory but, if you want to use this task in other tasks,
    // must be provided and unique
    id: 'example_task',

    // a user friendly name, just for reference, not mandatory
    name: 'Example task',

    // also not mandatory
    author: 'Indigo United',

    // filter is not mandatory, but can be used to perform some operation
    // on the options before running the subtasks
    filter: function (options) {
        // you can change existing options
        options.dir2 = options.dir2 + '_indigo';

        // and even define additional options. In this case we're defining
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
        },
        {
            // if you find yourself looking for something a bit more custom, you can
            // just provide a function as the task
            'task' : function (ctx, opt, next) {
                // the ctx provides some context information, like CWD
                // opt is a list of the options provided to the task

                console.log('I can do whatever I want', ctx, opt);

                // when the task is done, you just call next(), not like the MTV show, though…
                // (- -')
                next();
            }
        }
    ]
};

module.exports = task;
```


## Built-in tasks

### Filesystem

- mkdir
- rm
- symlink
- cp

### Scaffolding

- append (coming soon)
- prepend (coming soon)
- replace (coming soon)
- close (coming soon)

### Generic

- exec
- uglify (coming soon)
- minify (coming soon)
- concat (coming soon)

### Inline functions

If you find yourself trying to do something that is not supported by the existing tasks, you can just provide a function, instead of the task name, and it will be used as the task. This task will receive 3 arguments, a context object (with some useful values that you can use), an options object (the options that were provided to the subtask), and a callback that must be called once the subtask is over, giving you full flexibility, since your function can do whatever you like.


## Usage

### CLI

In order to run an `autofile`, you simply run `automaton`. This will look for `autofile.js` in the current working dir. Instead, you can also run `automaton some_dir/my_autofile.js`, enabling you to specify what `autofile` you want to run.

### Node.js

Automaton can also be used as a node module. Here's a quick example of its usage:

```javascript
var automaton = require('automaton');

// You can change the current working dir for automaton 
automaton.setCwd('/home/indigo/some/dir');

// Since autofiles are node modules themselves, you can just require them
// Note that instead, you could have instead declared the module inline, in JSON
var myTask = require('my_autofile');

automaton.run(myTask, { 'some_option': 'that is handy' });
```


## Credits

### Authors

- [Marco Oliveira](http://twitter.com/sonicspot)
- [André Cruz](http://twitter.com/satazor)

### Acknowledgements

Should be noted that this tool was inspired by already existing tools, and you should definitely take a look at them before deciding what is the right tool for the job at hand:

- [Initializr](http://www.initializr.com/), by [Jonathan Verrecchia](https://twitter.com/verekia)
- [Gruntjs](http://gruntjs.com/), by [Ben Alman](https://twitter.com/cowboy)

To these guys, a big thanks for their work.


## Disclaimer

Should be noted that Automaton is an open source project, and also work in progress. Feel free to contribute to the project, either with questions, ideas, or solutions. Don't forget to check out the issues page, as there are some improvements planned.

Thanks, and happy automation!