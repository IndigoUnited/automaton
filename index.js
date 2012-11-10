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

    var Automaton = d.Class.declare({
        $name: 'Automaton',

        _tasks: [],

        initialize: function () {
            // load core tasks
            this.loadTasks(__dirname + '/tasks');
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

        run: function (task, $options) {
            var i,
                batch           = [],
                batchDetails    = []
            ;
            this._assertIsObject(task);
            this._assertIsArray(task.tasks);

            console.log('Automating...'.info);

            batch = this._flattenTask(task, $options || {});

            // TODO: wrap tasks around a function that allows the user to disable a specific sub task
            var batchLength    = batch.length,
                waterfallBatch = []
            ;

            for (i = 0; i < batchLength; ++i) {
                task = batch[i];
                waterfallBatch.push(function (details, next) {
                    if (details.description) {
                        console.log('  ' + details.description.blue);
                    }

                    next();
                }.$bind(this, batchDetails[i] || {}));

                waterfallBatch.push(task.fn.$bind(this, task.options));
            }

            async.waterfall(waterfallBatch, function (err) {
                if (err) {
                    console.log('ERROR: '.error + err);
                    process.exit();
                }
                else {
                    console.log('Done'.info);
                }
            });

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

        _flattenTask: function (task, options, $depth) {
            var i,
                task,           // task that is being flattened
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
                        this._throwError('Missing option \'' + option + '\' in \'' + task.id + '\' task');
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
                    batch.push({ 'fn': currentSubtask.task, 'options': options });
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

                        batch = batch.concat(this._flattenTask(currentSubtask.task, subtaskOptions, $depth));
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

        _throwError: function (errorMsg) {
            throw new Error(errorMsg.error);
        }
    });

    module.exports = new Automaton();

})();