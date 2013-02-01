'use strict';

var d        = require('dejavu'),
    utils    = require('mout'),
    fs       = require('fs'),
    async    = require('async'),
    path     = require('path'),
    promptly = require('promptly'),
    inter    = require('./lib/string/cast-interpolate'),
    Logger   = require('./lib/Logger')
;

var Automaton = d.Class.declare({
    $name: 'Automaton',

    _tasks: [],
    _options: null,

    /**
     * Constructor.
     *
     * Available options:
     *  - verbosity - 0 means no logging
     *                1 means only 1 deep level tasks and so on..
     *                -1 means log every level
     *  - debug     - true to log debug messages, false otherwise
     *  - color     - true to keep colors in messages, false otherwise
     *
     * @param {Object} [$options] The options
     */
    initialize: function ($options) {
        this._options = $options;

        // load core tasks
        this.loadTasks(__dirname + '/tasks');
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
     * Retrieve the loaded tasks.
     *
     * @return {Object} The tasks
     */
    getTasks: function () {
        return this._tasks;
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
     * @return {Stream} A read stream where logging will be done
     */
    run: function (task, $options, $callback) {
        var batch,
            handle,
            context,
            stream;

        // function to handle the completion of the task
        handle = function (err) {
            if (err) {
                // if error is not actually an error, attempt to fix it
                if (!(err instanceof Error)) {
                    err = new Error(err + '');
                }

                // log the error
                context.log.errorln(err.message);
            }

            // signal the end of the stream
            stream.emit('end');

            // call callback if any
            if ($callback) {
                if (err) {
                    err.message = Logger.removeColors(err.message); // Remove any colors from the message
                }
                $callback(err);
            }

            return this;
        }.$bind(this);

        // setup an unique context for the task
        context = {};
        context.log = new Logger(this._options);
        context.prompt = promptly;
        stream = context.log.getStream();

        // catch any error while getting the batch
        // and report it with node style callback
        try {
            batch  = this._batchTask({
                task: task,
                options: $options || {},
                depth: 1,
                context: context
            });
        } catch (e) {
            setTimeout(function () {
                handle(e);
            }, 1);

            return stream;
        }

        // waterfall the batch
        async.waterfall(batch, handle);

        return stream;
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
            option,
            filter,
            afterFilter
        ;

        // if task is an id, grab its real definition
        if (utils.lang.isString(def.task)) {
            this._assertTaskLoaded(def.task, true);
            def.task = this._tasks[def.task];
        // otherwise, trigger validation if is the root task
        } else if (def.depth === 1) {
            this._validateTask(def.task);
        }

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
            next(this._validateTaskOptions(def.task, def.options));
        }.$bind(this);
        filter = function (next) {
            next = this._wrapTaskNextFunc(next, def);

            // replace options & report task
            this._replaceOptions(def.options, def.parentOptions, { skipUnescape : true });
            this._reportNextTask(def);

            // if there is an actual filter, run it and call the after filter
            if (def.task.filter) {
                async.series([
                    def.task.filter.$bind(def.context, def.options, def.context),
                    afterFilter
                ], next);
            // otherwise simply call the after filter
            } else {
                afterFilter(next);
            }
        }.$bind(this);
        batch.push(filter);

        // batch each task
        def.task.tasks.forEach(function (subtask) {
            var subtaskDef = this._createTaskDefinition(subtask, def),
                subtaskBatch;

            // if it's a function, just add it to the batch
            if (utils.lang.isFunction(subtask.task)) {
                batch.push(function (next) {
                    next = this._wrapTaskNextFunc(next, subtaskDef);

                    // skip task if disabled
                    if (!this._isTaskEnabled(subtaskDef)) {
                        return next();
                    }
                    this._reportNextTask(subtaskDef);
                    subtask.task.call(def.context, def.options, def.context, next);
                }.$bind(this));
            // it's not a function, then it must be another task
            } else {
                subtaskBatch = this._batchTask(subtaskDef);
                batch.push(function (next) {
                    next = this._wrapTaskNextFunc(next, subtaskDef);

                    // skip task if disabled
                    if (!this._isTaskEnabled(subtaskDef)) {
                        return next();
                    }
                    async.series(subtaskBatch, next);
                }.$bind(this));
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
        var def = utils.object.mixIn({}, task);

        def.options = def.options ? utils.lang.deepClone(def.options) : {};
        def.parentOptions = parentTaskDef.options || {},
        def.depth = parentTaskDef.depth + 1,
        def.context = parentTaskDef.context;

        return def;
    },

    /**
     * Wraps next function (callback) of a task.
     * This is needed to make fatal to work properly.
     *
     * @param {Function} next The next function
     * @param {Object}   def  The task definition
     *
     * @return {Function} The wrapped function
     */
    _wrapTaskNextFunc: function (next, def) {
        return function (err) {
            var fatal,
                name;

            if (err && def.hasOwnProperty('fatal')) {
                if (utils.lang.isFunction(def.fatal)) {
                    fatal = def.fatal(err, def.parentOptions, def.context);
                } else if (utils.lang.isString(def.fatal)) {
                    fatal = !!this._replacePlaceholders(def.fatal, def.options, { purge: true });
                } else {
                    fatal = def.fatal;
                }

                if (!fatal) {
                    name = def.task.id || def.task.name || 'unknown';
                    def.context.log.warnln('Task "' + name + '" silently failed.');

                    return next();
                }
            }

            next(err);
        }.$bind(this);
    },

    /**
     * Check if a task is enabled.
     * Disabled tasks should be skipped.
     *
     * Detects if a task is missing required options.
     *
     * @param {Object} def The task definition
     *
     * @return {Boolean} True if enabled, false otherwise
     */
    _isTaskEnabled: function (def) {
        if (def.hasOwnProperty('on')) {
            if (utils.lang.isString(def.on)) {
                return !!this._replacePlaceholders(def.on, def.parentOptions, { purge: true });
            } else if (utils.lang.isFunction(def.on)) {
                return !!def.on(def.options, def.context);
            } else {
                return !!def.on;
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
        var desc,
            logger = def.context.log,
            isPureFunction = utils.lang.isFunction(def.task);

        logger.setDepth(def.depth);

        // try out to extract the description, falling back to the name
        desc = def.description !== undefined ? def.description : def.task.description || def.task.name;

        // if desc is null, simply do not report it
        if (desc === null) {
            return;
        }

        if (!desc) {
            // if is a pure function that has no description, then simply do not report
            if (isPureFunction) {
                return;
            }
            // otherwise assume '??'
            desc = '??';
        }

        logger.infoln(('> ' + desc).cyan);
    },

    /**
     * Assert that a task is valid.
     *
     * @param {Object} task The task
     */
    _validateTask: function (task) {
        var taskId,
            x,
            curr,
            length;

        this._assertIsObject(task, 'Expected task to be an object', true);
        if (task.id !== undefined) {
            this._assertIsString(task.id, 'Expected id to be a string', true);
            this._assertIsNotEmpty(task.id, 'Task id cannot be empty.', true);
            taskId = task.id;
        } else {
            taskId = 'unknown';
        }

        if (task.name !== undefined) {
            this._assertIsString(task.name, 'Expected name to be a string in \'' + taskId + '\' task', true);
            this._assertIsNotEmpty(task.name, 'Expected name to not be empty \'' + taskId + '\' task', true);
        }
        if (task.author !== undefined) {
            this._assertIsString(task.author, 'Expected author to be a string in \'' + taskId + '\' task', true);
            this._assertIsNotEmpty(task.author, 'Expected author to not be empty \'' + taskId + '\' task.', true);
        }
        if (task.description !== undefined) {
            if (!utils.lang.isString(task.description) && task.description !== null) {
                this._throwError('Expected description to be a string or null in \'' + taskId + '\' task', true);
            }
            this._assertIsNotEmpty(task.description, 'Expected description to not be empty \'' + taskId + '\' task');
        }
        if (task.filter !== undefined) {
            this._assertIsFunction(task.filter, 'Expected filter to be a function in \'' + taskId + '\' task', true);
        }
        if (task.options !== undefined) {
            this._assertIsObject(task.options, 'Expected options to be an object in \'' + taskId + '\' task', true);
            for (x in task.options) {
                curr = task.options[x];
                this._assertIsObject(curr, 'Expected options definition to be an object in \'' + taskId + '\' task', true);
                if (curr.description !== undefined) {
                    this._assertIsString(curr.description, 'Expected \'' + x + '\' option description to be a string in \'' + taskId + '\' task', true);
                }
            }
        } else {
            task.options = {};
        }

        this._assertIsArray(task.tasks, 'Expected subtasks to be an array in \'' + taskId + '\' task', true);

        length = task.tasks.length;
        for (x = 0; x < length; ++x) {
            curr = task.tasks[x];

            this._assertIsObject(curr, 'Expected subtask at index \'' + x + '\' to be an object', true);
            if (utils.lang.isObject(curr.task)) {
                this._validateTask(curr.task);
            } else {
                if (!utils.lang.isString(curr.task) && !utils.lang.isFunction(curr.task)) {
                    this._throwError('Expected subtask at index \'' + x + '\' to be a string, a function or a task object in \'' + taskId + '\' task', true);
                }
                if (curr.description !== undefined && !utils.lang.isString(curr.description) && curr.description !== null) {
                    this._throwError('Expected subtask description at index \'' + x + '\' to be a string or null in \'' + taskId + '\' task', true);
                }
                if (curr.options !== undefined) {
                    this._assertIsObject(curr.options, 'Expected subtask options at index \'' + x + '\' to be an object in \'' + taskId + '\' task', true);
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
     * Assert not empty.
     *
     * @param {Mixed}   variable   The target to assert
     * @param {String}  msg        The error message to show if the assert fails
     * @param {Boolean} [$verbose] If verbose, an actual exception will be thrown
     *
     * @return {Error} The error object or null if none (only if not verbose)
     */
    _assertIsNotEmpty: function (variable, msg, $verbose) {
        if (!variable) {
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
            return new Error(msg);
        }

        throw new Error(Logger.removeColors(msg));
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