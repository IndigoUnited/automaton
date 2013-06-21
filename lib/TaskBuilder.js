'use strict';

var mout   = require('mout');
var assert = require('assert');

/**
 * TaskBuilder.
 */
function TaskBuilder() {
    this._task = {
        tasks: []
    };
}

/**
 * Set the task id.
 *
 * @param {String} id The task id
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.id = function (id) {
    this._task.id = id;

    return this;
};

/**
 * Set the task name.
 *
 * @param {String} name The task name
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.name = function (name) {
    this._task.name = name;

    return this;
};

/**
 * Set the task description.
 *
 * @param {String} desc The task description
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.description = function (desc) {
    this._task.description = desc;

    return this;
};

/**
 * Set the task author name.
 *
 * @param {String} author The task author name
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.author = function (author) {
    this._task.author = author;

    return this;
};

/**
 * Set the task required options.
 *
 * @param {String} name   The option name
 * @param {String} [desc] The option description
 * @param {Mixed}  [def]  The option default
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.option = function (name, desc, def) {
    var option = {};

    if (desc != null) {
        option.description = desc;
    }
    if (def !== undefined) {
        option.default = def;
    }

    this._task.options = this._task.options || {};
    this._task.options[name] = option;

    return this;
};

/**
 * Set the task setup.
 *
 * @param {Function} func The task setup
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.setup = function (func) {
    this._task.setup = func;

    return this;
};

/**
 * Set the task teardown.
 *
 * @param {Function} func The task teardown
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.teardown = function (func) {
    this._task.teardown = func;

    return this;
};

/**
 * Adds a task to be run.
 *
 * @param {String|Function|Object} task     The task
 * @param {Object}                 [config] The configuration
 *
 * @return {TaskBuilder} Chainable!
 */
TaskBuilder.prototype.do = function (task, config) {
    config = config || {};
    config.task = task;
    this._task.tasks.push(config);

    return this;
};

/**
 * Get the task object.
 *
 * @return {Object} The task.
 */
TaskBuilder.prototype.toObject = function () {
    return this._task;
};

/**
 * Validates a task object, throwing an error if something
 * is wrong.
 *
 * @param  {Object} task The task object
 */
TaskBuilder.validate = function (task) {
    var taskId;
    var x;
    var curr;
    var length;

    assert(mout.lang.isPlainObject(task), 'Expected task to be an object');
    if (task.id !== undefined) {
        assert(mout.lang.isString(task.id), 'Expected id to be a string');
        assert(task.id, 'Task id cannot be empty.');
        taskId = task.id;
    } else {
        taskId = 'unknown';
    }

    if (task.name !== undefined) {
        assert(mout.lang.isString(task.name), 'Expected name to be a string in \'' + taskId + '\' task');
        assert(task.name, 'Expected name to not be empty in \'' + taskId + '\' task');
    }
    if (task.author !== undefined) {
        assert(mout.lang.isString(task.author), 'Expected author to be a string in \'' + taskId + '\' task');
        assert(task.author, 'Expected author to not be empty in \'' + taskId + '\' task.');
    }
    if (task.description !== undefined) {
        assert(mout.lang.isString(task.description) || task.description === null, 'Expected description to be a string or null in \'' + taskId + '\' task');
    }
    if (task.setup !== undefined) {
        assert(mout.lang.isFunction(task.setup), 'Expected setup to be a function in \'' + taskId + '\' task');
    }
    if (task.teardown !== undefined) {
        assert(mout.lang.isFunction(task.teardown), 'Expected teardown to be a function in \'' + taskId + '\' task');
    }
    if (task.options !== undefined) {
        assert(mout.lang.isPlainObject(task.options), 'Expected options to be an object in \'' + taskId + '\' task');
        for (x in task.options) {
            curr = task.options[x];
            assert(mout.lang.isPlainObject(curr), 'Expected options definition to be an object in \'' + taskId + '\' task');
            if (curr.description !== undefined) {
                assert(mout.lang.isString(curr.description), 'Expected \'' + x + '\' option description to be a string in \'' + taskId + '\' task');
            }
        }
    }

    assert(mout.lang.isArray(task.tasks), 'Expected subtasks to be an array in \'' + taskId + '\' task', true);

    length = task.tasks.length;
    for (x = 0; x < length; ++x) {
        curr = task.tasks[x];

        assert(mout.lang.isPlainObject(curr), 'Expected subtask at index \'' + x + '\' to be an object');
        if (mout.lang.isPlainObject(curr.task)) {
            TaskBuilder.validate(curr.task);
        } else {
            assert(mout.lang.isString(curr.task) || mout.lang.isFunction(curr.task), 'Expected subtask at index \'' + x + '\' to be a string, a function or a task object in \'' + taskId + '\' task');
        }

        if (curr.description !== undefined) {
            assert(mout.lang.isString(curr.description) || mout.lang.isFunction(curr.description) || curr.description === null, 'Expected subtask description at index \'' + x + '\' to be a string or null in \'' + taskId + '\' task');
        }
        if (curr.options !== undefined) {
            assert(mout.lang.isPlainObject(curr.options), 'Expected subtask options at index \'' + x + '\' to be an object in \'' + taskId + '\' task');
        }
        if (curr.grunt !== undefined) {
            assert(mout.lang.isBoolean(curr.grunt) || mout.lang.isPlainObject(curr.grunt), 'Expected subtask grunt at index \'' + x + '\' to be a boolean or an object in \'' + taskId + '\' task');
        }
    }
};

module.exports = TaskBuilder;
