var d       = require('dejavu'),
    utils   = require('amd-utils'),
    colors  = require('colors'),
    fs      = require('fs'),
    util    = require('util'),
    async   = require('async')
;

inspect = function (v, levels) {
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

    run: function (tasks) {
        var i,
            tasksLength     = tasks.length,
            task,
            batch           = [],
            batchDetails    = [],
            batchDetailsPos = 0
        ;
        this._assertIsArray(tasks);

        console.log('Automating...'.info);

        // create context that is given to the tasks
        var ctx = {
            cwd: process.cwd()
        }

        // for each of the tasks that will run
        for (i = 0; i < tasksLength; ++i) {
            // assert that the task is valid
            task = tasks[i];
            this._assertIsObject(task, 'Invalid task specified at index \'' + i + '\'');
            task.options = task.options || {};

            // TODO: check if `task` property exists
            this._assertIsObject(task.options, 'Invalid options provided for task \'' + task.task + '\'');

            // if no suitable task is loaded to run the requested task, fail
            this._assertTaskLoaded(task.task);

            // TODO: grab the task description

            // CONTINUE HERE
            batchDetails[batchDetailsPos] = {
                'description': task.description
            };

            var taskSubtasks = this._flattenTask(task.task, task.options);

            batchDetailsPos += taskSubtasks.length;

            batch = batch.concat(taskSubtasks);
            // TODO: wrap tasks around a function that allows the user to disable a specific task
            // TODO: create an argument handler, that allows the main task to receive arguments and pass them to the subtasks either by changing their arguments, or by specifying params that can be accessed in the config in some pattern, like %param_name%
        }

        var batchLength    = batch.length,
            waterfallBatch = []
        ;

        for (i = 0; i < batchLength; ++i) {
            task = batch[i];
            waterfallBatch.push(function (details, next) {
//                console.log('Iterating: '.info);
                if (details.description) {
                    console.log('  ' + details.description.blue);
                }

                next();
            }.$bind(this, batchDetails[i] || {}));

            waterfallBatch.push(task.fn.$bind(this, ctx, task.options));
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

    _flattenTask: function (taskId, options) {
        var i,
            task = this._tasks[taskId], // task that is being flattened
            subtasks,                   // subtasks of the task being flattened
            subtasksLength,             // total of subtasks of the task being flattened
            currentSubtask,             // iteration task
            batch = []                  // final result
        ;

        options = options || {};

        subtasks       = task.tasks;
        subtasksLength = subtasks.length;

        for (i = 0; i < subtasksLength; ++i) {
            currentSubtask = subtasks[i];

            this._assertIsObject(currentSubtask, 'Invalid task specified at index \'' + i + '\'');

            if (!currentSubtask.task) {
                this._throwError('Task type at index \'' + i + '\' not specified');
            }

            // if it's a function, just add it to the batch
            if (utils.lang.isFunction(currentSubtask.task)) {
                batch.push({ 'fn': currentSubtask.task, 'options': options });
            }
            // it's not a function, then it must be another task
            else {
                if (utils.lang.isString(currentSubtask.task)) {
                    // TODO: mix-in the options arg, overriding local options?
//console.log('mixing ', currentSubtask, options);
                    var subtaskOptions = utils.object.mixIn({}, currentSubtask, options);
                        subtaskId      = currentSubtask.task;
                    delete subtaskOptions.task;
                    batch = batch.concat(this._flattenTask(subtaskId, subtaskOptions));
                }
                else {
                    this._throwError('Invalid subtask specified in task \'' + taskId + '\', at index \'' + i + '\'');
                }
            }
        }

        return batch;
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