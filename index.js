(function () {
    'use strict';

    var d       = require('dejavu'),
        utils   = require('amd-utils'),
        colors  = require('colors'),
        fs      = require('fs'),
        util    = require('util'),
        async   = require('async')
    ;

    var inspect = function (v, levels) {
        levels = levels || 10;
        console.log(util.inspect(v, false, levels, true));
    };

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

    function nop(options, next) {
        next();
    }

    var Automaton = d.Class.declare({
        $name: 'Automaton',
/*
        $constants: {
            // terminal escape character
            ESCAPE_CODE: '\u001b',

            // display attributes reset
            RESET_CODE: '\u001b[0m',

            CHECK: '✔'
        },
*/
        _tasks: [],

        _verbosity: 1,

        initialize: function () {
            // load core tasks
            this.loadTasks(__dirname + '/tasks');
        },

        setVerbosity: function (depth) {
            this._verbosity = depth;
        },

        addTask: function (task) {
            this._assertIsObject(task, 'Invalid task provided');
            this._assertIsString(task.id, 'You have provided a task without ID');

            this._tasks[task.id] = task;

            return this;
        },

        removeTask: function (id) {
            this._assertIsString(id, 'Invalid task id provided \'' + id + '\'');

            delete this._tasks[id];

            return this;
        },

        run: function (task, $options, $callback) {
            var i,
                batch        = [],
                batchDetails
            ;

            if (utils.lang.isString(task)) {
                this._assertTaskLoaded(task);
                task = this.getTask(task);
            }

            this._assertIsObject(task);
            this._assertIsArray(task.tasks);

            //this._log('Automating...'.info);

            batch = this._flattenTask(task, $options || {});

            // put a control function between each of the subtasks, allowing for feedback, and other inter-subtask operations
            var batchLength    = batch.length,
                waterfallBatch = [],
                subtask
            ;

            for (i = 0; i < batchLength; ++i) {
                subtask = batch[i];
                batchDetails = {
                    'description': subtask.description,
                    'depth': subtask.depth,
                    'options': subtask.options
                };

                waterfallBatch.push(function (details, next) {
                    if (details.description) {
                        this._log('  - ' + details.description.blue, details.depth, false);
                    }

                    next();
                }.$bind(this, batchDetails));

                waterfallBatch.push(subtask.fn.$bind(this, subtask.options));

/*                waterfallBatch.push(function (details, next) {
                    if (details.description) {
                        this._t_left(details.description.length + 2);
                        this._log('  ' + this.$static.CHECK.green + ' ' + details.description.blue, details.depth);
                    }

                    next();
                }.$bind(this, batchDetails));*/
            }

            async.waterfall(waterfallBatch, function (err) {
                if (err) {
                    if (utils.lang.isFunction($callback)) {
                        $callback(new Error('ERROR: '.error + err));
                    }
                    else {
                        console.error('ERROR: '.error + err);
                        process.exit();
                    }
                }
                else {
                    if (utils.lang.isFunction($callback)) {
                        $callback();
                    }
                    // task DONE
                    //this._log('Done'.info);
                }
            }.$bind(this));

        },

        loadTasks: function (folder) {
            this._assertIsString(folder);

            folder = fs.realpathSync(folder) + '/';

            var filenames = fs.readdirSync(folder),
                i
            ;

            for (i = filenames.length - 1; i >= 0; --i) {
                this.addTask(require(folder + filenames[i].split(/\./)[0]));
            }

            return this;
        },

        getTask: function (taskId) {
            this._assertTaskLoaded(taskId);

            return this._tasks[taskId];
        },

        _flattenTask: function (task, options, $depth) {
            var i,
//                task,           // task that is being flattened
                subtasks,       // subtasks of the task being flattened
                subtasksLength, // total of subtasks of the task being flattened
                currentSubtask, // iteration task
                batch = [],     // final result
                option
            ;

            options = options || {};

            $depth = $depth || 0;

            if (utils.lang.isString(task)) {
                this._assertTaskLoaded(task);
                task = this._tasks[task];
            }

            this._assertIsObject(task);

            if (!utils.lang.isString(task.id)) {
                task.id = 'Non-identified task';
            }

            // check if all the task required options were provided
            // if task has a definition of the options
            if (utils.lang.isObject(task.options)) {
                // fill in the options with default values where the option was not provided
                for (option in task.options) {
                    if (task.options[option].hasOwnProperty('default') && !options.hasOwnProperty(option)) {
                        options[option] = task.options[option]['default'];
                    }
                }

                // if task has a filter, run it before checking if all the options are ok
                if (utils.lang.isFunction(task.filter)) {
                    task.filter(options);
                }

                // for each option in the definition
                for (option in task.options) {
                    // if option was not provided to the task, abort
                    if (!options.hasOwnProperty(option)) {
                        this._throwError('Missing option \'' + option + '\' in \'' + task.id + '\' task', true);
                    }
                }
            }
            else {
                // if task has a filter, run it
                if (utils.lang.isFunction(task.filter)) {
                    task.filter(options);
                }
            }

            subtasks       = task.tasks;
            subtasksLength = subtasks.length;

            for (i = 0; i < subtasksLength; ++i) {
                currentSubtask = subtasks[i];

                this._assertIsObject(currentSubtask, 'Invalid task specified at index \'' + i + '\'');

                if (!currentSubtask.task) {
                    this._throwError('Task type at index \'' + i + '\' not specified');
                }

                // check if subtask is disabled
                var enabled = true;
                if (currentSubtask.hasOwnProperty('on')) {
                    if (utils.lang.isString(currentSubtask.on)) {
                        enabled = !!this._replacePlaceholders(currentSubtask.on, options);
                    }
                    else {
                        enabled = currentSubtask.on;
                    }
                }

                // if subtask is disabled, skip to the next subtask
                if (!enabled) {
                    continue;
                }

                // if it's a function, just add it to the batch
                if (utils.lang.isFunction(currentSubtask.task)) {
                    batch.push({
                        'description': currentSubtask.hasOwnProperty('description') ? this._replacePlaceholders(currentSubtask.description, options) : null,
                        'depth': $depth,
                        'fn': currentSubtask.task,
                        'options': options
                    });
                }
                // it's not a function, then it must be another task, check if it is loaded, and flatten it
                else {
                    if (utils.lang.isString(currentSubtask.task)) {
                        this._assertTaskLoaded(currentSubtask.task);

                        // generate the options for the subtask
                        var subtaskOptions = {},
                            optionValue
                        ;
                        if (utils.lang.isObject(currentSubtask.options)) {
                            for (option in currentSubtask.options) {
                                optionValue = currentSubtask.options[option];
                                // if option value is a string, replace the placeholders by its correspondent value
                                subtaskOptions[option] = utils.lang.isString(optionValue) ? this._replacePlaceholders(optionValue, options) : optionValue;
                            }
                        }

                        batch = batch.concat({
                            // this NOP subtask is added, so that the description shows up in the feedback
                            'description': currentSubtask.hasOwnProperty('description') ? this._replacePlaceholders(currentSubtask.description, options) : null,
                            'depth': $depth,
                            'fn': nop, // no operation function
                            'options': options
                        }).concat(this._flattenTask(currentSubtask.task, subtaskOptions, $depth + 1));
                    }
                    else {
                        this._throwError('Invalid subtask specified in task \'' + task.id + '\', at index \'' + i + '\' (\'' + currentSubtask.task + '\')');
                    }
                }
            }

            return batch;
        },

        _replacePlaceholders: function (str, options) {
            return utils.string.interpolate(str, options);
        },

        _assertTaskLoaded: function (taskId) {
            if (!utils.lang.isObject(this._tasks[taskId])) {
                throw new Error('Could not find any task handler suitable for \'' + taskId + '\'');
            }
        },

        _assertIsString: function (variable, errorMsg) {
            if (!utils.lang.isString(variable)) {
                throw new Error(errorMsg.error);
            }
        },

        _assertIsObject: function (variable, errorMsg) {
            if (!utils.lang.isObject(variable)) {
                throw new Error(errorMsg.error);
            }
        },

        _assertIsFunction: function (variable, errorMsg) {
            if (!utils.lang.isFunction(variable)) {
                throw new Error(errorMsg.error);
            }
        },

        _assertIsArray: function (variable, errorMsg) {
            if (!utils.lang.isArray(variable)) {
                throw new Error(errorMsg.error);
            }
        },

        _throwError: function (errorMsg, $pretty) {
            if ($pretty) {
                console.error('\n' + errorMsg.error + '\n');
                process.exit(1);
            }

            throw new Error(errorMsg.error);
        },

        _log: function (msg, $depth, $newLine) {
            $depth   = $depth || 0;
            $newLine = $newLine || true;
console.log('testing verbosity', $depth, this._verbosity);
            if ($depth <= this._verbosity) {
                if ($newLine) {
                    util.puts(msg);
                }
                else {
                    util.print(msg);
                }
            }
        },

        _error: function (msg, $depth) {
            $depth = $depth || 0;
            if ($depth <= this._verbosity) {
                console.error(msg);
            }
        }
/*
        _t_reset: function () {
            util.print(this.$static.RESET_CODE);

            return this;
        },

        _t_clear: function () {
            util.print(this.$static.ESCAPE_CODE + '[2J');

            return this;
        },

        _t_up: function (n) {
            util.print(this.$static.ESCAPE_CODE + '[' + n + 'A');

            return this;
        },

        _t_down: function (n) {
            util.print(this.$static.ESCAPE_CODE + '[' + n + 'B');

            return this;
        },

        _t_left: function (n) {
            util.print(this.$static.ESCAPE_CODE + '[' + n + 'D');

            return this;
        },

        _t_right: function (n) {
            util.print(this.$static.ESCAPE_CODE + '[' + n + 'C');

            return this;
        }
*/
    });

    module.exports = new Automaton();

})();