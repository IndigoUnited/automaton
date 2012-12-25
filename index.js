'use strict';

var d       = require('dejavu'),
    utils   = require('amd-utils'),
    fs      = require('fs'),
    async   = require('async'),
    path    = require('path'),
    inter   = require('./lib/string/cast-interpolate'),
    Logger  = require('./lib/Logger')
;

var Automaton = d.Class.declare({
    $name: 'Automaton',

    _tasks: [],
    _logger: null,
    _context: {},

    /**
     * Constructor.
     *
     * Available options:
     *  - stdout    - a stream to write log messages (defaults to process.stdout, null to disable)
     *  - stderr    - a stream to write error log messages (defaults to process.stdout, null to disable)
     *  - verbosity - 0 means no logging
     *                1 means only 1 deep level tasks and so on..
     *                -1 means log every level
     *  - debug     - true to log debug messages, false otherwise
     *
     * @param {Object} [$options] The options
     */
    initialize: function ($options) {
        // init logger & setup context
        this._logger = new Logger($options);
        this._context.log = this._logger;

        // load core tasks
        this.loadTasks(__dirname + '/tasks');
    },

    /**
     * Get the logger.
     *
     * @return {Logger} The logger instance
     */
    getLogger: function () {
        return this._logger;
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
        this._validateTask(task);

        if (!task.id) {
            this._throwError('Can only add tasks with an id', true);
        }

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
        this._assertIsString(id, 'Invalid task id provided', true);
        delete this._tasks[id];

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
        this._assertTaskLoaded(taskId, true);

        return this._tasks[taskId];
    },

    /**
     * Load tasks in a given folder.
     *
     * @param {String} folder The folder to search for tasks
     *
     * @return {Automaton} Chainable!
     */
    loadTasks: function (folder) {
        this._assertIsString(folder, 'Expected folder to be a string', true);

        folder = fs.realpathSync(folder) + '/';

        var filenames = fs.readdirSync(folder),
            file,
            i
        ;

        for (i = filenames.length - 1; i >= 0; --i) {
            file = filenames[i];

            // skip files that do not have a .js extension
            if (path.extname(file) !== '.js') {
                continue;
            }

            this.addTask(require(folder + file));
        }

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
        var batch,
            handle;

        // function to handle the completion of the task
        handle = function (err) {
            if ($callback) {
                if (err) {
                    err.message = this._logger.uncolor(err.message);
                }
                $callback(err);
            }

            return this;
        }.$bind(this);

        // catch any error while getting the batch
        try {
            batch  = this._batchTask({
                task: task,
                options: $options
            });
        } catch (e) {
            return handle(e);
        }

        // waterfall the batch
        async.waterfall(batch, handle);

        return this;
    },

    /**
     * Create a batch for a task.
     * The batch is a sequence of functions that form the task.
     *
     * @param {Object} task The task definition
     *
     * @return {Array} The batch
     */
    _batchTask: function (def) {
        var batch = [],
            error,
            option,
            filter,
            afterFilter
        ;

        // if task is an id, grab its real definition
        if (utils.lang.isString(def.task)) {
            this._assertTaskLoaded(def.task, true);
            def.task = this._tasks[def.task];
        }

        def.options = def.options || {};
        def.parentOptions = def.parentOptions || {};
        def.description = def.description || def.task.description;
        def.depth = def.depth || 1;

        // fill in the options with default values where the option was not provided
        for (option in def.task.options) {
            if (def.options[option] === undefined && def.task.options[option]['default'] !== undefined) {
                def.options[option] = def.task.options[option]['default'];
            }
        }

        // batch the filter
        afterFilter = function (next) {
            // we need to replace options again because parent filter might have
            // added options that are placeholders
            this._replaceOptions(def.options, def.parentOptions);
            error = this._validateTaskOptions(def.task, def.options);
            next(error);
        }.$bind(this);
        filter = function (next) {
            // replace options & report task
            this._replaceOptions(def.options, def.parentOptions, { skipUnescape : true });
            this._reportNextTask(def);

            // if there is an actual filter, run it and call the filter afterwards
            if (def.task.filter) {
                async.waterfall([
                    def.task.filter.$bind(this._context, def.options),
                    afterFilter
                ], next);
            // otherwise simply call the after filter
            } else {
                afterFilter(next);
            }
        }.$bind(this);
        batch.push(filter);

        // batch each task
        def.task.tasks.forEach(function (currentSubtask) {
            var subtaskBatch;

            // if it's a function, just add it to the batch
            if (utils.lang.isFunction(currentSubtask.task)) {
                batch.push(function (next) {
                    // skip task if disabled
                    if (!this._isTaskEnabled(currentSubtask, def.options)) {
                        return next();
                    }
                    this._reportNextTask(this._createTaskDefinition(currentSubtask, def));
                    currentSubtask.task.call(this._context, def.options, next);
                }.$bind(this));
            // it's not a function, then it must be another task, check if it is loaded, and batch it
            } else if (utils.lang.isString(currentSubtask.task)) {
                this._assertTaskLoaded(currentSubtask.task);

                subtaskBatch = this._batchTask(this._createTaskDefinition(currentSubtask, def));
                batch.push(function (subtask, subtaskBatch, next) {
                    // skip task if disabled
                    if (!this._isTaskEnabled(subtask, def.options)) {
                        return next();
                    }
                    async.waterfall(subtaskBatch, next);
                }.$bind(this, currentSubtask, subtaskBatch));
            }
        }, this);

        return batch;
    },

    /**
     * Creates a task definition for a task.
     *
     * @param {Object} task          The task
     * @param {Object} parentTaskDef The parent task definition
     *
     * @return {Object} The task definition
     */
    _createTaskDefinition: function (task, parentTaskDef) {
        return {
            task: task.task,
            description: task.description,
            options: utils.lang.clone(task.options),
            parentOptions: parentTaskDef.options,
            depth: parentTaskDef.depth + 1
        };
    },

    /**
     * Check if a task is enabled.
     * Disabled tasks should be skipped.
     *
     * Detects if a task is missing required options.
     *
     * @param {Object} task    The task definition
     * @param {Object} options The task options
     *
     * @return {Boolean} True if enabled, false otherwise
     */
    _isTaskEnabled: function (task, options) {
        if (task.hasOwnProperty('on')) {
            if (utils.lang.isString(task.on)) {
                return !!this._replacePlaceholders(task.on, options, { purge: true });
            } else if (utils.lang.isFunction(task.on)) {
                return !!task.on(options);
            } else {
                return !!task.on;
            }
        }

        return true;
    },

    /**
     * Replace target placeholders with their correspondent options value.
     * If the target is an array or an object, it will replace them
     * recursively.
     *
     * @param {Mixed}  target     The target which will get its values replaced
     * @param {Object} values     The values
     * @param {Object} [$options] The interpolation options
     *
     * @return {Mixed} The passed target
     */
    _replaceOptions: function (target, values, $options) {
        var k,
            newK;

        if (utils.lang.isObject(target)) {
            for (k in target) {
                newK = this._replacePlaceholders(k, values, $options) + '';
                target[newK] = this._replaceOptions(target[k], values, $options);
                if (newK !== k) {
                    delete target[k];
                }
            }
        } else if (utils.lang.isArray(target)) {
            for (k = target.length - 1; k >= 0; --k) {
                target[k] = this._replaceOptions(target[k], values, $options);
            }
        } else if (utils.lang.isString(target)) {
            target = this._replacePlaceholders(target, values, $options);
        }

        return target;
    },

    /**
     * Replace placeholders in a string with their correspondent values
     *
     * @param {String} str        The string
     * @param {Object} values     The values
     * @param {Object} [$options] The interpolation options
     *
     * @return {String} The replaced string
     */
    _replacePlaceholders: function (str, values, $options) {
        return inter(str, values, $options);
    },

    /**
     * Report the next task that will run.
     *
     * @param {Object} task The task definition
     */
    _reportNextTask: function (def) {
        var desc;

        this._logger.setDepth(def.depth);

        if (def.description) {
            desc = utils.lang.isFunction(def.description) ? def.description(def.options) : def.description;
            this._logger.infoln(('> ' + desc).cyan);
        }
    },

    /**
     * Assert that a task is valid.
     *
     * @param {Object} task The task
     */
    _validateTask: function (task) {
        var taskId = task.id || 'unknown',
            x,
            currTask;

        this._assertIsObject(task, 'Expected task to be an object', true);
        if (task.id !== undefined) {
            this._assertIsString(task.id, 'Expected id to be a string', true);
            if (!task.id) {
                this._throwError('Task id cannot be empty.', true);
            }
        }
        if (task.name !== undefined) {
            this._assertIsString(task.name, 'Expected name to be a string in \'' + taskId + '\' task', true);
        }
        if (task.author !== undefined) {
            this._assertIsString(task.author, 'Expected author to be a string in \'' + taskId + '\' task', true);
        }
        if (task.description !== undefined && !utils.lang.isString(task.description) && !utils.lang.isFunction(task.description)) {
            this._throwError('Expected description to be a string or a function in \'' + taskId + '\' task', true);
        }
        if (task.filter !== undefined) {
            this._assertIsFunction(task.filter, 'Expected filter to be a function in \'' + taskId + '\' task', true);
        }
        if (task.options !== undefined) {
            this._assertIsObject(task.options, 'Expected options to be an object in \'' + taskId + '\' task', true);
            // TODO: validate options object
        } else {
            task.options = {};
        }

        this._assertIsArray(task.tasks, 'Expected subtasks to be an array in \'' + taskId + '\' task', true);

        for (x = 0; x < task.tasks; ++x) {
            currTask = task.tasks[x];

            this._assertIsObject('Expected subtask at index \'' + x + '\' to be an object', true);
            if (utils.lang.isObject(currTask.task)) {
                this._assertIsValidTask(currTask.task);
            } else {
                if (!utils.lang.isString(currTask.task) && !utils.lang.isFunction(currTask.task)) {
                    this._throwError('Expected subtask at index \'' + x + '\' to be a string, a function or a task object in \'' + taskId + '\' task', true);
                }
                if (currTask.description !== undefined && !utils.lang.isString(task.description) && !utils.lang.isFunction(task.description)) {
                    this._throwError('Expected subtask description at index \'' + x + '\' to be a string or a function in \'' + taskId + '\' task', true);
                }
                if (currTask.options !== undefined) {
                    this._assertIsObject(currTask.options, 'Expected subtask options at index \'' + x + '\' to be an object in \'' + taskId + '\' task', true);
                }
            }
        }
    },

    /**
     * Validate the task options.
     * Detects if a task is missing required options.
     *
     * @param {Object}  task       The task definition
     * @param {Object}  options    The task options
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     */
    _validateTaskOptions: function (task, options, $verbose) {
        for (var option in task.options) {
            // if option was not provided to the task, abort
            if (options[option] === undefined) {
                return this._throwError('Missing option \'' + option + '\' in \'' + task.id + '\' task', $verbose);
            }
        }
    },

    /**
     * Assert task is loaded.
     *
     * @param {String}  taskId     The task id
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _assertTaskLoaded: function (taskId, $verbose) {
        if (!utils.lang.isObject(this._tasks[taskId])) {
            return this._throwError('Could not find any task handler suitable for \'' + taskId + '\'', $verbose);
        }
    },

    /**
     * Assert string.
     *
     * @param {Mixed}   variable   The target to assert
     * @param {String}  msg        The error message to show if the assert fails
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _assertIsString: function (variable, msg, $verbose) {
        if (!utils.lang.isString(variable)) {
            return this._throwError(msg, $verbose);
        }
    },

    /**
     * Assert object.
     *
     * @param {Mixed}   variable   The target to assert
     * @param {String}  msg        The error message to show if the assert fails
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _assertIsObject: function (variable, msg, $verbose) {
        if (!utils.lang.isObject(variable)) {
            return this._throwError(msg, $verbose);
        }
    },

    /**
     * Assert function.
     *
     * @param {Mixed}   variable   The target to assert
     * @param {String}  msg        The error message to show if the assert fails
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _assertIsFunction: function (variable, msg, $verbose) {
        if (!utils.lang.isFunction(variable)) {
            return this._throwError(msg, $verbose);
        }
    },

    /**
     * Assert array.
     *
     * @param {Mixed}   variable   The target to assert
     * @param {String}  msg        The error message to show if the assert fails
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _assertIsArray: function (variable, msg, $verbose) {
        if (!utils.lang.isArray(variable)) {
            return this._throwError(msg, $verbose);
        }
    },

    /**
     * Throws an error.
     *
     * @param {String}  msg        The error message
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _throwError: function (msg, $verbose) {
        if (!$verbose) {
            this._logger.errorln(msg);
            return new Error(msg);
        }

        throw new Error(this._logger.uncolor(msg));
    },

    $statics: {
        /**
         * Creates a new automaton instance.
         * Please see the constructor for more info about the available options.
         *
         * @param {Object} [$options] The options
         *
         * @return {Automaton} A new automaton instance
         */
        create: function ($options) {
            return new Automaton($options);
        }
    }
});

module.exports = Automaton;