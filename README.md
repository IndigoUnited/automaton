Automaton
=========

Task automation tool built in JavaScript.

**IMPORTANT**  
This README reflects the upcoming `0.2.0` release.   
Please see http://indigounited.com/automaton/ for version on `0.1.4` published on `npm`.

[![Build Status](https://secure.travis-ci.org/IndigoUnited/automaton.png)](http://travis-ci.org/IndigoUnited/automaton)

![Automaton](http://indigounited.github.com/automaton/img/stamp.png)

## Why?

You often find yourself needing to do some repetitive operation, and this is usually the time to quickly bake some ad-hoc script. Still, from project to project you find yourself needing to reuse some task you had already previously created.

Automaton eases this process, allowing you to quickly set up an `autofile`, which describes what you want to do, by means of an ordered list of tasks that need to run for the task as a whole to be complete.

A little detail that makes Automaton a powerful tool, is that every `autofile` you create can itself be used by another `autofile`, turning the first one into a single task (imagine boxes within boxes). If you are curious, you can take a look at the source code, and check for yourself that even the tasks that Automaton provides built-in are simple `autofiles`.


## Built-in tasks

`automaton` comes bundled with a few tasks to ease your own tasks.

### Filesystem

- **chmod:** Change mode of files
- **cp:** Copy files and directories
- **mv:** Move files and directories
- **mkdir:** Make directories recursively
- **rm:** Remove several files or directories
- **symlink:** Create symlink


### Scaffolding

Scaffolding tasks help you perform some typical tasks, like appending, replacing, and others, to placeholders in a template file. Any text file can be a template. These tasks will look for a `{{placeholder_name}}` inside the file, and perform the operation on it.

- **scaffolding-append:** Append something to a placeholder in a file
- **scaffolding-replace:** Replace the placeholder with something
- **scaffolding-close:** Close the placeholder (effectively removing the placeholder)
- **scaffolding-file-rename:** Rename files by replacing placeholders found in their names

### Miscellaneous

- **run:** Run a shell command
- **init:** Initialise an empty autofile
- uglify (soon)
- minify (soon)
- concat (soon)


## Installing

You can simply install Automaton through NPM, by running `npm install -g automaton`. This will install Automaton globally, and you will be able to execute `automaton` in your terminal.

If you only plan to use `automaton` programatically, you can just install it locally.


## Creating a task

An automaton task is a simple object, describing what the task will do.

### Simple task

For illustration purposes, here's a simple `autofile` that just creates a folder and copies a file into it:

```js
var myTask = {
    tasks: [
        {
            task: 'mkdir',
            description: 'Create the project root folder',
            options: {
                dirs: ['some_dir']
            }
        },
        {
            task: 'cp',
            description: 'Copy some file',
            options: {
                files: {
                    'some_file': 'some_dir/dest_file'
                }
            }
        }
    ]
};

module.exports = myTask;
```

### More complete task


To illustrate most of the capabilities of `automaton`, here's a complete `autofile` with comments along the file:

```js
var task = {
    // This id is not mandatory but,
    // if you want to use this task in other tasks,
    // must be provided and should be unique.
    id: 'example_task',

    // A user friendly name,
    // just for reference, not mandatory.
    name: 'Example task',

    // Also not mandatory
    author: 'Indigo United',

    // Description is not mandatory,
    // but can be used to give a base description for the task.
    description: 'My example task',

    // Setup is not mandatory,
    // but can be used to perform some operation
    // before running the subtasks (e.g.: change options)
    setup: function (options, ctx, next) {
        // You can change existing options.
        options.dir2 = options.dir2 + '_indigo';

        // and even define additional options.
        // In this case we're defining
        // a `dir3` option,
        // which will be used by one of the subtasks.
        options.dir3 = 'united';

        next();
    },

    // Teardowm is not mandatory,
    // but can be used to perform some operation
    // after running the subtasks
    teardown: function (options, ctx, next) {
        // do something afterwards (e.g.: cleanup something)
        next();
    },

    // This is also optional,
    // but useful if you want the automaton
    // to automatically check for required options,
    // and some additional features
    // Check below for more info.
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
        },
        debug: {
            'default': true
        }
    },

    // A list of subtasks that will run
    // when the example_task runs.
    tasks: [
        {
            task: 'mkdir',
            description: 'Create the root and second folder',
            options: {
                // the option below
                // will have its placeholders replaced by
                // the value that it receives.
                dirs: ['{{dir1}}/{{dir2}}']
            }
        },
        {
            task: 'mkdir',
            // Description messages can be generated according to the options
            // by using a string with placeholders or a function.
            description: function (opt) {
                return 'Creating ' + opt.dir1 + '/' + opt.dir2 + '/' + opt.dir3
            },
            options: {
                dirs: ['{{dir1}}/{{dir2}}/{{dir3}}']
            },
            // This 'on' attributes allows you to
            // enable/disable a subtask just by setting it
            // to a falsy value.
            // In this case, we even used a placeholder,
            // allowing us to skip this subtask depending
            // on the run_all option. Of course, you have
            // just setted it to something like `false`.
            on: '{{run_all}}',
            // This 'fatal' attribute allows to bypass tasks that fail.
            // In this case, we even used a placeholder,
            // allowing us to skip this subtask depending
            // on the debug option. Of course, you have
            // just setted it to something like `false`.
            fatal: '{{debug}}',
            // This 'mute' attribute allows you to completly mute log
            // calls made inside this task as well its subtasks.
            // In this case, we used `false` but it could have been
            // a placeholder.
            mute: false
        },
        {
            // If you find yourself looking
            // for something a bit more custom,
            // you can just provide a function as the task.
            // More details about inline functions below
            // in the "Inline functions" section.
            task : function (opt, ctx, next) {
                // opt is a list of the options
                // provided to the task.

                // ctx.log gives you access to the Logger.
                // The Logger should be used to perform any
                // logging information, and is preferred to
                // any console.* methods, as this gives additional
                // control. More information on ctx in the
                // "Inline Functions" section.
                ctx.log.writeln('I can do whatever I want', opt);

                // When the task is done,
                // you just call next(),
                // not like the MTV show, though…
                // (- -')
                next();
            },
            // The 'on' attribute can also be a function
            // for more complex cases.
            on: function (opt, ctx) {
                return !!opt.run_all;
            },
            // The 'fatal' attribute can also be a function
            // for more complex cases.
            fatal: function (err, opt, ctx) {
                // 'err' is an instance of Error
                return err.code !== 'ENOENT';
            },
            // The 'mute' attribute can also be a function
            // for more complex cases.
            mute: function (opt, ctx) {
                return !opt.debug;
            }
        }
    ]
};

module.exports = task;
```

Note that placeholders can be escaped with backslashes:
`'\\{\\{dir1\\}\\}'`

### Inline functions

If you find yourself trying to do something that is not supported by the existing tasks, you can just provide a function, instead of the task name, and it will be used as the task.

This task will receive 3 arguments, an options object (the options that were provided to the subtask), a context object (more on this later), and a callback that must be called once the subtask is over, giving you full flexibility, since your function can do whatever you like.

The second argument, the context, is used to provide you with a tool belt that will aid you while developing `automaton` tasks. It currently provides you a `log` object, which is an instance of [Logger](https://github.com/IndigoUnited/automaton/blob/master/lib/Logger.js), and can be used to handle logging. Using the `automaton` logger is preferred to using the traditional `console.*` methods, since it gives additional control over logging to whoever is running the task.

The `Logger` provides the following methods:

- Normal logging: `write()`, `writeln()`
- Information logging: `info()`, `infoln()`
- Warnings logging: `warn()`, `warnln()`
- Error logging: `error()`, `errorln()`
- Success logging: `success()`, `successln()`
- Debug logging: `debug()`, `debugln()` (These will only be outputted when in debug mode)

The *ln* variants of each method output a new line (`\n`) in the end. Note that these methods work just like your typical `console.*` methods, so you can pass multiple arguments, and they will all get logged.

Here's an example usage:

```js
'use strict';

var inspect = require('util').inspect;

var task = {
    id: 'bogus',
    tasks: [
        {
            task: function (opt, ctx, next) {
                ctx.log.writeln(
                    'hello,',
                    'here\'s the process',
                    inspect(process)
                );

                next();
            }
        }
    ]
};

module.exports = task;
```

### Grunt tasks

You are able to run `grunt` tasks in `automaton`. It's actually very simple:

```js
var task = {
    id: 'my-task',
    tasks: [
        {
            task: 'mincss',
            grunt: true,
            options: {
                files: {
                    'path/to/output.css': 'path/to/input.css'
                }
            }
        }
    ]
};

module.exports = task;
```

By default, `automaton` autoload tasks located in `tasks/` and npm tasks (that start with grunt-).
If your task lives in a different folder, you can specify it in the `grunt` config. Other config options like
`force` and `verbose` can also be specified:

```js
var task = {
    id: 'my-task',
    tasks: [
        {
            task: 'some-grunt-task',
            grunt: {
                tasks: ['lib/tasks/'],
                force: true,
                verbose: true
                // other grunt config goes here
            },
            options: {
                some: 'option'
            }
        }
    ]
};

module.exports = task;
```

### Loading tasks

Once you start building your own tasks, you will probably find yourself wanting to use some custom task within another task you're working on. In order to do this, you have a few options, depending on how you are using automaton.

If you are using `automaton` in the CLI, you have the `--task-dir`. This tells automaton to load all the tasks in that folder, making them available to you, just like the built-in tasks.

If you are using `automaton` programatically, you have a bigger range of possibilities:

1. Run `automaton.loadTasks(/some/folder/with/tasks)`. This is the equivalent to what you would to in the CLI, with the exception that you can call this multiple times, loading multiple folders.

2. `require()` the task yourself, just like you would with any `NodeJS` module, and then call `automaton.addTask(your_task)`. Just like `loadTasks()`, this will make the task you just added available on `automaton` as if it is a built-in task.

3. `require()` the task in the task that depends on it, and use it directly in the subtask list, where you would typically put a task name, or an inline function.


## Usage

### CLI

All you need to use the CLI can be found by executing `automaton -h`. This will show you how to use `automaton`, and any of the loaded tasks.

In order to run an `autofile`, you simply run `automaton`. This will look for `autofile.js` in the current working dir. Instead, you can also run `automaton some_dir/my_autofile.js`, enabling you to specify what `autofile` you want to run.

### Node.js

`automaton` can also be used programatically as a node module. Here's a quick example of its usage:

```js
var automaton = require('automaton').create(/*options go here*/);

// Since autofiles are node modules themselves,
// you can just require them
// Note that you could have instead declared
// the module inline, in JSON.
var myTask = require('my_autofile');

// Note that we're running a task that you have loaded using node's
// require, and passing it as the first argument of the run() function.
// Instead, you can load the task using loadTask(), and then simply
// pass its id (a string), as the first argument of run. You can find an
// example of this below, in the Logging section.
automaton.run(myTask, { 'some_option': 'that is handy' }, function (err) {
    if (err) {
        console.log('Something went wrong: ' + err.message);
    } else {
        console.log('All done!');
    }
});
```

#### Logging

`automaton.run()` returns a readable stream that is used for outputting log information. The depth of this log can be controlled by a `verbosity` option, provided upon instantiation.

There are also a few other options. Here's a full list:

- **verbosity:** Controls the depth of the log. Remember the box in a box analogy? This controls how many boxes deep you want to go, regarding logging information.
  - **0:** no logging
  - **1:** 1 level deep (default)
  - ***n*:** *n* levels deep
  - **-1:** show all levels
- **debug:** If you want to receive debug logging messages. `false` by default.
- **color:** If you want the logging information to contain colors. `true` by default.

Here's an example of the usage of the stream, with custom options:

```js
var automaton = require('automaton').create({
    verbosity: 3, // show me 3 level deep logging info
    debug: true,  // show me debug logging
    color: false  // disable colors
});

// run some task
automaton
    .run('run', { cmd: 'echo SUCCESS!' })
    .pipe(process.stdout);
```

As you can see, we've tweaked all the `automaton` options, and even piped the logging information to `STDOUT`. What you do exactly with the stream, it's completely up to you.


## Acknowledgements

Should be noted that this tool was inspired by already existing tools, and you should definitely take a look at them before deciding what is the right tool for the job at hand:

- [Initializr](http://www.initializr.com/), by [Jonathan Verrecchia](https://twitter.com/verekia)
- [Gruntjs](http://gruntjs.com/), by [Ben Alman](https://twitter.com/cowboy)

To these guys, a big thanks for their work.

Also, big thanks to [Ricardo Pereira](http://designer-freelancer.com/), for his awesome work with the mascot.

## Contributing

Should be noted that Automaton is an open source project, and also work in progress. Feel free to contribute to the project, either with questions, ideas, or solutions. Don't forget to check out the issues page, as there are some improvements planned.

Thanks, and happy automation!


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
