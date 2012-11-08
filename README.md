Automaton
=========

Task automation tool built in JavaScript.

## Why?

Many times you find yourself needing to do some repetitive operation, and this is usually the time to quickly bake some script does that. Still, from project to project you find yourself needing to reuse some task you had already previously created. Automaton eases this process, allowing you to quickly set up an `autofile`, which describes what you want to do, by means of a list of tasks that need to run, in order, for the task as a whole to be done.

A little detail that makes Automaton a powerful tool, is that every `autofile` you create can itself be used by another `autofile`, turning the first one into a single task (imagine tasks are boxes, and you can have boxes within boxes). If you are curious, you can take a look at the source code, and check for yourself that even the tasks that Automaton provides built-in are themselves `autofiles`.

## Installing

You can simply install Automaton through NPM, by running `npm install -g automaton`. This will install Automaton globally, and you will be able to execute `automaton` in your terminal.

## Usage

### CLI

In order to run an `autofile`, you simply run `automaton`. This will look for `autofile.js` in the current working dir. Instead, you can also run `automaton some_dir/my_autofile.js`, enabling you to specify what `autofile` you want to run.

### Node.js

Automaton can also be used as a node module. Here's a quick example of its usage:

```
var automaton = require('automaton');

// You can change the current working dir for automaton 
automaton.setCwd('/home/indigo/some/dir');

// Since autofiles are node modules themselves, you can just require them
// Note that instead, you could have instead declared the module inline, in JSON
var myTask = require('my_autofile.js');

automaton.run(myTask, [ 'some_option': 'that is handy' ]);
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