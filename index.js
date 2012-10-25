var d      = require('dejavu'),
    utils  = require('amd-utils'),
    colors = require('colors')
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
            unifiedTasks
        ;
        this._assertIsArray(tasks);

        for (i = 0; i < tasksLength; ++i) {
            task = tasks[i];
            this._assertIsObject(task, 'Invalid task specified at index \'' + i + '\'');
            task.options = task.options || {};

            this._assertIsString(task.id, 'Invalid task id provided \'' + id + '\'');
            this._assertIsObject(task.options, 'Invalid options provided for task \'' + task.id + '\'');

            if (!utils.lang.isObject(this._tasks[task.id])) {
                // CONTINUE HERE
                // need to create a function that flattens the task tree
                // after getting the flattened task tree, create separator functions that hold a reference to the next separator, in order to support skipping sub tasks
                // once all is ready, run the tasks
            }
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
    }
});

module.exports = new Automaton();