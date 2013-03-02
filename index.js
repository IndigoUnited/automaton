'use strict';

var d           = require('dejavu'),
    utils       = require('mout'),
    fs          = require('fs'),
    assert      = require('assert'),
    async       = require('async'),
    glob        = require('glob'),
    promptly    = require('promptly'),
    inter       = require('./lib/string/interpolate'),
    castInter   = require('./lib/string/cast-interpolate'),
    validate    = require('./lib/validate_task'),
    Logger      = require('./lib/Logger'),
    TaskBuilder = require('./lib/TaskBuilder'),
    GruntRunner = require('./lib/grunt/Runner')
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
        var dirs = glob.sync(__dirname + '/node_modules/autofile-*');

        dirs.forEach(function (dir) {
            var errors = this.loadTasks(dir, 'autofile.js');
            if (errors.length) {
                throw new Error(errors[0]);
            }
        }, this);
    },

    /**
     * Add new task.
     * If the task already exists, it will be replaced.
     * The task will be validaded only when its run.
     *
     * @param {Object|Function} task The task definition
     *
     * @return {Automaton} Chainable!
     */
    addTask: function (task) {
        task = this._getTaskObject(task);
        validate(task);

        assert(task.id, 'Can only add tasks with an id');
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
        assert(utils.lang.isString(id), 'Invalid task id provided');
        delete this._tasks[id];

        return this;
    },

    /**
     * Retrieve a task definition by its id.
     *
     * @param {String} taskId The task id
     *
     * @return {Object} The task definition or null if not loaded
     */
    getTask: function (taskId) {
        var task = this._tasks[taskId];

        return task ? task : null;
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
     * If the folder contain tasks that are not valid, it results in an error being pushed to
     * an array. That array is returned by the function.
     *
     * @param {String} folder  The folder to search for tasks
     * @param {String} pattern The pattern to use when searching for files, defaults to '*.js'
     *
     * @return {Array} An array of errors
     */
    loadTasks: function (folder, pattern) {
        assert(utils.lang.isString(folder), 'Expected folder to be a string');

        pattern = pattern || '*.js';
        folder = fs.realpathSync(folder) + '/';

        var filenames = glob.sync(folder + '/' + pattern),
            errors = [];

        filenames.forEach(function (file) {
            try {
                this.addTask(require(file));
            } catch (e) {
                errors.push(new Error('Unable to add task "' + file + '": ' + e.message));
            }
        }, this);

        return errors;
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
            // kill the grunt worker
            context.gruntRunner.kill();

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
        context.gruntRunner = new GruntRunner(context);
        context.prompt = promptly;
        context.string = {};
        context.string.interpolate = inter;
        context.string.castInterpolate = castInter;

        stream = context.log.getStream();

        // catch any error while getting the batch
        // and report it with node style callback
        batch  = this._batchTask(this._createTaskDefinition({
            task: task,
            options: $options,
            context: context
        }));

        // run the batch
        process.nextTick(batch.bind(batch, handle));
        return stream;
    },

    /**
     * Get the task object in case the task is a function that will build the object.
     *
     * @param {Object|Function} task The task object or the builder
     *
     * @return {Object} The task
     */
    _getTaskObject: function (task) {
        var builder;

        if (utils.lang.isFunction(task)) {
            builder = new TaskBuilder();
            try {
                task(builder);
            } catch (e) {
                throw new Error('Unable to get task from builder: ' + e.message);
            }
            task = builder.toObject();
        }

        return task;
    },

    /**
     * Create a batch for a task.
     * The batch is a sequence of functions that form the task.
     *
     * @param {Object} task The task definition
     *
     * @return {Function} The batch
     */
    _batchTask: function (def) {
        var batch = [],
            preTaskFunc,
            posTaskFunc,
            option
        ;

        // if task is an id
        if (utils.lang.isString(def.task)) {
            // grab its real definition
            this._assertTaskLoaded(def.task);
            def.task = this.getTask(def.task);
        } else {
            // if task is a function then needs a builder
            if (utils.lang.isFunction(def.task)) {
                def.task = this._getTaskObject(def.task);
            }
            // trigger validation if is the root task
            if (def.depth === 1) {
                validate(def.task);
            }
        }

        // fill in the options with default values where the option was not provided
        for (option in def.task.options) {
            if (def.options[option] === undefined && def.task.options[option].default !== undefined) {
                def.options[option] = def.task.options[option].default;
            }
        }

        // pre-task
        preTaskFunc = function (next) {
            var prevNext = next;

            // replace options
            this._replaceOptions(def.options, def.parentOptions, { skipUnescape : true });

            // skip task if disabled
            if (!this._isTaskEnabled(def)) {
                return process.nextTick(next.bind(next, null, true));
            }

            // report task
            this._onBeforeTask(def);

            // after running the setup, we need to replace options again
            // because parent setup might have added options that are placeholders
            // also we valid if the all mandatory task options are ok
            next = function (err) {
                if (err) {
                    return process.nextTick(prevNext.bind(prevNext, err));
                }

                this._replaceOptions(def.options, def.parentOptions);
                process.nextTick(prevNext.bind(prevNext, this._validateTaskOptions(def.task, def.options)));
            }.$bind(this);

            // run setup
            if (def.task.setup) {
                def.task.setup.call(def.context, def.options, def.context, next);
            } else {
                next();
            }
        }.$bind(this);

        // tasks
        def.task.tasks.forEach(function (subtask) {
            var subtaskDef = this._createTaskDefinition(subtask, def);

            // if it's a grunt task
            if (subtaskDef.grunt) {
                batch.push(this._batchGruntTask(subtaskDef));
            // if it's a inline function
            } else if (utils.lang.isFunction(subtaskDef.task) && subtaskDef.task.length !== 1) {
                batch.push(this._batchFunctionTask(subtaskDef));
            // then it must be another task
            } else {
                batch.push(this._batchTask(subtaskDef));
            }
        }, this);

        // post task
        posTaskFunc = function (err, next) {
            err = this._onAfterTask(def, err);

            // handle teardown
            if (def.task.teardown) {
                def.task.teardown.call(def.context, def.options, def.context, function (teardownErr) {
                    teardownErr = this._onAfterTask(def, teardownErr);
                    process.nextTick(next.bind(next, err || teardownErr));
                }.$bind(this));
            } else {
                process.nextTick(next.bind(next, err));
            }
        }.$bind(this);

        // return a final function which calls everything in order
        return function (next) {
            // run pre-task
            preTaskFunc(function (err, disabled) {
                // if task is disabled, call next
                if (disabled) {
                    return next();
                }

                // if there was an error in the pre-task, run pos-task immediately
                if (err) {
                    return posTaskFunc(err, next);
                }

                // run each subtask
                async.series(batch, function (err) {
                    // finally run the pos-task, even if there was an error
                    posTaskFunc(err, next);
                });
            });
        };
    },

    /**
     * Create a batch for single function task.
     *
     * @param {Object} task The task definition
     *
     * @return {Function} The batch
     */
    _batchFunctionTask: function (def) {
        return function (next) {
            this._replaceOptions(def.options, def.parentOptions);

            // skip task if disabled
            if (!this._isTaskEnabled(def)) {
                return process.nextTick(next);
            }

            // Report task
            this._onBeforeTask(def);

            // run the function
            // note that the options are the parent options
            def.task.call(def.context, def.parentOptions, def.context, function (err) {
                err = this._onAfterTask(def, err);
                process.nextTick(next.bind(next, err));
            }.$bind(this));
        }.$bind(this);
    },

    /**
     * Create a batch for a grunt task.
     *
     * @param {Object} task The task definition
     *
     * @return {Function} The batch
     */
    _batchGruntTask: function (def) {
        return function (next) {
            // replace options
            this._replaceOptions(def.options, def.parentOptions);

            // skip task if disabled
            if (!this._isTaskEnabled(def)) {
                return process.nextTick(next);
            }

            // report task
            this._onBeforeTask(def);

            // run grunt task in the grunt runner
            def.grunt = !utils.lang.isObject(def.grunt) ? {} : def.grunt;
            def.context.gruntRunner
                .run(def.task, def.options, def.grunt)
                .on('data', def.context.log.write.$bind(def.context.log))
                .on('error', function (err) {
                    def.context.log.errorln(err.message);
                })
                .on('end', function (err) {
                    err = this._onAfterTask(def, err);
                    process.nextTick(next.bind(next, err));
                }.$bind(this));
        }.$bind(this);
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
        def.depth = 1;

        if (parentTaskDef) {
            def.parentOptions = parentTaskDef.options;
            def.context = parentTaskDef.context;
            def.depth += parentTaskDef.depth;
        }

        return def;
    },

    /**
     * Function to run before each task.
     * Reports the task that will run and sets up the logger.
     *
     * @param {Object} task The task definition
     */
    _onBeforeTask: function (def) {
        var desc,
            logger = def.context.log,
            inline = utils.lang.isFunction(def.task) || def.grunt;

        // try out to extract the description, falling back to the name
        desc = def.description !== undefined ? def.description : def.task.description || def.task.name;

        // if desc is null, simply do not report it
        if (desc !== null) {
            if (!desc) {
                // if is an inline function that has no description, then simply do not report
                if (inline) {
                    desc = null;
                } else {
                    // otherwise assume '??'
                    desc = '??';
                }
            }
        }

        // set the logger depth
        logger.setDepth(def.depth);

        // log task that will run
        if (desc != null) {
            logger.infoln('> ' + desc);
        }

        // mute the logger if task is marked as muted and logger is unmuted
        if (!logger.isMuted() && this._isTaskMuted(def)) {
            logger.mute();
            def.mutedLogger = true;
        }
    },

    /**
     * Function to run after each task.
     * Finishes up the logger and handle fatal.
     *
     * @param {Object} task The task definition
     * @param {Error}  err  The task error or null if none
     *
     * @return {Error} The error after processing
     */
    _onAfterTask: function (def, err) {
        var name;

        // handle fatal
        if (err && !this._isTaskFatal(def, err)) {
            name = def.task.id || def.task.name || 'unknown';
            def.context.log.debugln('Task "' + name + '" silently failed: ' + err.message);
            err = null;
        }

        // unmute the logger if this task muted the logger
        if (def.mutedLogger) {
            def.context.log.unmute();
            delete def.mutedLogger;
        }

        return err;
    },

    /**
     * Check if a task is fatal.
     * Disabled tasks should be skipped.
     *
     * @param {Object} def The task definition
     * @param {Error}  err The task error or null if none
     *
     * @return {Boolean} True if enabled, false otherwise
     */
    _isTaskFatal: function (def, err) {
        if (def.hasOwnProperty('fatal')) {
            if (utils.lang.isString(def.fatal)) {
                return !!this._replacePlaceholders(def.fatal, def.parentOptions, { purge: true });
            } else if (utils.lang.isFunction(def.fatal)) {
                return !!def.fatal.call(def.context, err, def.parentOptions, def.context);
            } else {
                return !!def.fatal;
            }
        }

        return true;
    },

    /**
     * Check if a task is enabled.
     * Disabled tasks should be skipped.
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
                return !!def.on.call(def.context, def.parentOptions, def.context);
            } else {
                return !!def.on;
            }
        }

        return true;
    },

    /**
     * Check if a task is muted.
     * Muted tasks do not log messages.

     * @param {Object} def The task definition
     *
     * @return {Boolean} True if muted, false otherwise
     */
    _isTaskMuted: function (def) {
        if (def.hasOwnProperty('mute')) {
            if (utils.lang.isString(def.mute)) {
                return !!this._replacePlaceholders(def.mute, def.parentOptions, { purge: true });
            } else if (utils.lang.isFunction(def.mute)) {
                return !!def.mute.call(def.context, def.parentOptions, def.context);
            } else {
                return !!def.mute;
            }
        }

        return false;
    },

    /**
     * Replace target placeholders with their correspondent options value.
     * If the target is an array or an object, it will replace them
     * recursively.
     *
     * @param {Mixed}  target     The target which will get its values replaced
     * @param {Object} values     The values
     * @param {Object} [$options] The castInterpolation options
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
     * @param {Object} [$options] The castInterpolation options
     *
     * @return {String} The replaced string
     */
    _replacePlaceholders: function (str, values, $options) {
        return castInter(str, values, $options);
    },

    /**
     * Validate the task options.
     * Detects if a task is missing required options.
     *
     * @param {Object}  task       The task definition
     * @param {Object}  options    The task options
     *
     * @return {Error} The error if any
     */
    _validateTaskOptions: function (task, options, $verbose) {
        for (var option in task.options) {
            // if option was not provided to the task, abort
            if (options[option] === undefined) {
                return new Error('Missing option \'' + option + '\' in \'' + task.id + '\' task', $verbose);
            }
        }
    },

    /**
     * Assert task is loaded.
     *
     * @param {String} taskId The task id
     */
    _assertTaskLoaded: function (taskId) {
        assert(this.getTask(taskId), 'Could not find any task handler suitable for \'' + taskId + '\'');
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