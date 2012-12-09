(function () {
    'use strict';

    var d       = require('dejavu'),
        utils   = require('amd-utils'),
        colors  = require('colors'),
        fs      = require('fs'),
        util    = require('util'),
        async   = require('async'),
        path    = require('path'),
        inter   = require('./lib/castInterpolate')
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

    var Automaton = d.Class.declare({
        $name: 'Automaton',

        _tasks: [],
        _verbosity: 1,

        /**
         * Constructor.
         */
        initialize: function () {
            // load core tasks
            this.loadTasks(__dirname + '/tasks');
        },

        /**
         * Set verbosity level.
         *
         * 0 means no logging.
         * 1 means only 1 deep level tasks are able to log.
         * 2 means 1 and 2 deep level tasks are able to log.
         * And so on..
         *
         * @param {Number} depth The depth
         *
         * @return {Automaton} Chainable!
         */
        setVerbosity: function (depth) {
            this._verbosity = depth;

            return this;
        },

        /**
         * Add new task.
         * If the task already exists, it will be replaced.
         * The task will be validaded only when its run.
         *
         * @param {Object} task The task definition
         *
         * @return {Automaton} Chainable!
         */
        addTask: function (task) {
            this._assertIsObject(task, 'Invalid task provided');
            this._assertIsString(task.id, 'You have provided a task without ID');

            this._tasks[task.id] = task;

            return this;
        },

        /**
         * Remove task.
         *
         * @param {String} id The task id
         *
         * @return {Automaton} Chainable!
         */
        removeTask: function (id) {
            this._assertIsString(id, 'Invalid task id provided \'' + id + '\'');
            delete this._tasks[id];

            return this;
        },

        /**
         * Run a task.
         * The callback follows the node style.
         *
         * @param {String|Object} task        The task id or definition
         * @param {Object}        [$options]  The task options
         * @param {Function}      [$callback] A callback to be called when the task completes
         *
         * @return {Automaton} Chainable!
         */
        run: function (task, $options, $callback) {
            var batch  = this._batchTask(task, $options);

            async.waterfall(batch, function (err) {
                if (err) {
                    if (utils.lang.isFunction($callback)) {
                        $callback(new Error(err));
                    } else {
                        this._throwError(err);
                    }
                } else {
                    // TODO: all done, should we output something?
                    if (utils.lang.isFunction($callback)) {
                        $callback();
                    }
                }
            }.$bind(this));

            return this;
        },

        /**
         * Load tasks in a given folder.
         *
         * @param {String} folder The folder to search for tasks
         *
         * @return {Automaton} Chainable!
         */
        loadTasks: function (folder) {
            this._assertIsString(folder, 'Expected folder to be a string');

            folder = fs.realpathSync(folder) + '/';

            var filenames = fs.readdirSync(folder),
                i
            ;

            for (i = filenames.length - 1; i >= 0; --i) {
                this.addTask(require(folder + path.basename(filenames[i], '.js')));
            }

            return this;
        },

        /**
         * Retrieve a task definition by its id.
         *
         * @param {String} taskId The task id
         *
         * @return {Object} The task definition
         */
        getTask: function (taskId) {
            this._assertTaskLoaded(taskId);

            return this._tasks[taskId];
        },

        /**
         * Create a batch for a task.
         * The batch is a sequence of functions that form the task.
         *
         * @param {String|Object} task       The task id or definition
         * @param {Object}        [$options] The task options
         */
        _batchTask: function (task, options) {
            var i,
                subtasks,         // subtasks of the task being batched
                subtasksLength,   // total of subtasks of the task being batched
                currentSubtask,   // iteration task
                batch = [],       // batch of tasks
                option,
                subtaskBatch,
                filter,
                parentOptions = arguments[2] || {},
                depth = arguments[3] != null ? arguments[3] : 1
            ;

            options = options || {};
            // If task is an id, grab its real definition
            if (utils.lang.isString(task)) {
                this._assertTaskLoaded(task);
                task = this._tasks[task];
            }

            this._assertIsObject(task, 'Expected task to be an object');

            if (!utils.lang.isString(task.id)) {
                task.id = 'Non-identified task';
            }

            if (task.filter) {
                this._assertIsFunction(task.filter, 'Expected filter to be a function in \'' + task.id + '\' task');
            }

            // check if all the task required options were provided
            // if task has a definition of the options
            if (task.options) {
                this._assertIsObject(task.options, 'Expected options to be an object in \'' + task.id + '\' task');

                // fill in the options with default values where the option was not provided
                for (option in task.options) {
                    if (options[option] === undefined && task.options[option]['default'] !== undefined) {
                        options[option] = task.options[option]['default'];
                    }
                }

                if (task.filter) {
                    // besides calling the filter, we need to validate the required options afterwards.
                    filter = function (next) {
                        // replace the options
                        this._replaceOptions(options, parentOptions);
                        // run the filter and validate task afterwards
                        async.waterfall([
                            // TODO: this could be a loggin interface
                            task.filter.$bind(this, options),
                            function (next) {
                                this._validateTaskOptions(task, options);
                                next();
                            }.$bind(this)
                        ], next);
                    }.$bind(this);
                } else {
                    filter = function (next) {
                        // no filter, so we only replace options and validate the required options
                        this._replaceOptions(options, parentOptions);
                        this._validateTaskOptions(task, options);
                        next();
                    }.$bind(this);
                }
            } else if (task.filter) {
                // TODO: this could be a loggin interface
                filter = task.filter.$bind(this, options);
            }

            if (filter) {
                batch.push(filter);
            }

            this._assertIsArray(task.tasks, 'Expected subtasks to be an array in \'' + task.id + '\' task');

            subtasks       = task.tasks;
            subtasksLength = subtasks.length;

            for (i = 0; i < subtasksLength; ++i) {
                currentSubtask = subtasks[i];

                this._assertIsObject(currentSubtask, 'Invalid subtask specified at index \'' + i + '\' in \'' + task.id + '\' task');

                if (!utils.lang.isString(currentSubtask.task) && !utils.lang.isFunction(currentSubtask.task)) {
                    this._throwError('Subtask type at index \'' + i + '\' must be a function or an object in \'' + task.id + '\' task');
                }

                // if it's a function, just add it to the batch
                if (utils.lang.isFunction(currentSubtask.task)) {
                    batch.push(function (subtask, next) {
                        // we need to replace options again because parent filter might have
                        // added options that are placeholders
                        this._replaceOptions(options, parentOptions);
                        // skip task if disabled
                        if (!this._isTaskEnabled(subtask, options)) {
                            return next();
                        }
                        this._reportNextTask(this, subtask, options, depth);
                        // TODO: the this of the task could be a logging interface
                        subtask.task.call(this, options, next);
                    }.$bind(this, currentSubtask));
                // it's not a function, then it must be another task, check if it is loaded, and batch it
                } else if (utils.lang.isString(currentSubtask.task)) {
                    this._assertTaskLoaded(currentSubtask.task);

                    subtaskBatch = this._batchTask(currentSubtask.task, currentSubtask.options, options, depth + 1);
                    batch.push(function (subtask, subtaskBatch, next) {
                        // we need to replace options again because parent filter might have
                        // added options that are placeholders
                        this._replaceOptions(options, parentOptions);
                        // skip task if disabled
                        if (!this._isTaskEnabled(subtask, options)) {
                            return next();
                        }
                        this._reportNextTask(this, subtask, options, depth);
                        async.waterfall(subtaskBatch, next);
                    }.$bind(this, currentSubtask, subtaskBatch));
                }
            }

            return batch;
        },

        /**
         * Validate the task options.
         * Detects if a task is missing required options.
         *
         * @param {Object} task    The task definition
         * @param {Object} options The task options
         */
        _validateTaskOptions: function (task, options) {
            // for each option in the definition
            for (var option in task.options) {
                // if option was not provided to the task, abort
                if (options[option] === undefined) {
                    this._throwError('Missing option \'' + option + '\' in \'' + task.id + '\' task');
                }
            }
        },

        /**
         * Check if a task is enabled.
         * Disabled tasks should be skipped.
         *
         * Detects if a task is missing required options.
         *
         * @param {Object} task    The task definition
         * @param {Object} options The task options
         */
        _isTaskEnabled: function (task, options) {
            if (task.hasOwnProperty('on')) {
                return utils.lang.isString(task.on) ?
                    !!this._replacePlaceholders(task.on, options, true)
                    : task.on;
            }

            return true;
        },

        /**
         * Replace target placeholders with their correspondent options value.
         * If the target is an array or an object, it will replace them
         * recursively.
         *
         * @param {Mixed}  target  The target which will get its values replaced
         * @param {Object} options The options
         *
         * @return {Mixed} The passed target
         */
        _replaceOptions: function (target, options) {
            var k;

            if (utils.lang.isObject(target)) {
                for (k in target) {
                    target[k] = this._replaceOptions(target[k], options);
                }
            } else if (utils.lang.isArray(target)) {
                for (k = target.length - 1; k >= 0; --k) {
                    target[k] = this._replaceOptions(target[k], options);
                }
            } else if (utils.lang.isString(target)) {
                target = this._replacePlaceholders(target, options);
            }

            return target;
        },

        /**
         * Replace placeholders in a string with their correspondent options value
         *
         * @param {String} str                   The string
         * @param {Object} options               The options
         * @param {Boolean} [$removeUnspecified] True to remove placeholders that had no matchings, false otherwise
         *
         * @return {String} The replaced string
         */
        _replacePlaceholders: function (str, options, removeUnspecified) {
            return inter(str, options, removeUnspecified);
        },

        /**
         * Parses a task description.
         * The description can be a string or a function.
         * If it's a function, it will be called with the options, in order to
         * generate a complex description based on the them.
         * Placeholders will be handled with Automaton#_replacePlaceholders.
         *
         * @param  {String|Function} description The task description
         * @param  {Object}          options     The task options
         *
         * @return {String} The parsed description
         */
        _parseDescription: function (description, options) {
            if (utils.lang.isFunction(description)) {
                description = description(options);
            } else if (description != null) {
                description = this._replacePlaceholders(description, options, true);
            }

            return description;
        },

        /**
         * Report the next task that will run.
         *
         * @param {Object} task    The task definition
         * @param {Object} options The task options
         * @param {Number} depth   The task depth
         */
        _reportNextTask: function (task, options, depth) {
            if (task.description) {
                this._log('  - ' + task.description.cyan, depth, false);
            }
        },

        /**
         * Assert task is loaded.
         *
         * @param {String} taskId The task id
         */
        _assertTaskLoaded: function (taskId) {
            if (!utils.lang.isObject(this._tasks[taskId])) {
                this._throwError('Could not find any task handler suitable for \'' + taskId + '\'');
            }
        },

        /**
         * Assert string.
         *
         * @param {Mixed} variable  The target to assert
         * @param {String} errorMsg The error message to show if the assert fails
         */
        _assertIsString: function (variable, errorMsg) {
            if (!utils.lang.isString(variable)) {
                this._throwError(errorMsg);
            }
        },

        /**
         * Assert object.
         *
         * @param {Mixed} variable  The target to assert
         * @param {String} errorMsg The error message to show if the assert fails
         */
        _assertIsObject: function (variable, errorMsg) {
            if (!utils.lang.isObject(variable)) {
                this._throwError(errorMsg);
            }
        },

        /**
         * Assert function.
         *
         * @param {Mixed} variable  The target to assert
         * @param {String} errorMsg The error message to show if the assert fails
         */
        _assertIsFunction: function (variable, errorMsg) {
            if (!utils.lang.isFunction(variable)) {
                this._throwError(errorMsg);
            }
        },

        /**
         * Assert array.
         *
         * @param {Mixed} variable  The target to assert
         * @param {String} errorMsg The error message to show if the assert fails
         */
        _assertIsArray: function (variable, errorMsg) {
            if (!utils.lang.isArray(variable)) {
                this._throwError(errorMsg);
            }
        },

        // TODO: the functions bellow are not stable..
        //       streams will be added and we can't do
        //       process.exit() because we won't be able to use
        //       automaton programatically
        _throwError: function (errorMsg, $verbose) {
            if (!$verbose) {
                console.error('\n' + errorMsg.error + '\n');
                process.exit(1);
            }

            throw new Error(errorMsg);
        },

        _log: function (msg, $depth, $newLine) {
            $depth   = $depth || 0;
            $newLine = $newLine || true;

            if ($depth <= this._verbosity) {
                if ($newLine) {
                    util.puts(msg);
                } else {
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
    });

    module.exports = new Automaton();

})();