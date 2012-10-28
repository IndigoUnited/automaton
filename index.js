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
            tasksLength = tasks.length,
            task,
            batch = []
        ;
        this._assertIsArray(tasks);

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

            // CONTINUE HERE
            batch = batch.concat(this._flattenTask(task.task, task.options));
            // need to create a function that flattens the task tree
            // after getting the flattened task tree, create separator functions that hold a reference to the next separator, in order to support skipping sub tasks
            // once all is ready, run the tasks
        }

        var batchLength    = batch.length,
            waterfallBatch = []
        ;

//        inspect(batch);
        for (i = 0; i < batchLength; ++i) {
            task = batch[i];
            waterfallBatch.push(function (next) {
                console.log('Iterating...'.info);

                next();
            });

            waterfallBatch.push(task.fn.$bind(this, task.options));
        }

        async.waterfall(waterfallBatch);

    },

    loadTasks: function (folder) {
        this._assertIsString(folder);

        var filenames = fs.readdirSync(folder),
            i
        ;
        folder = fs.realpathSync(folder) + '/';

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
        throw new Error(errorMsg.error)
    }
});

module.exports = new Automaton();