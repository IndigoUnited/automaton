'use strict';

var lang = require('mout/lang');
var assert = require('assert');

function validate(task) {
    var taskId,
        x,
        curr,
        length;

    assert(lang.isPlainObject(task), 'Expected task to be an object');
    if (task.id !== undefined) {
        assert(lang.isString(task.id), 'Expected id to be a string');
        assert(task.id, 'Task id cannot be empty.');
        taskId = task.id;
    } else {
        taskId = 'unknown';
    }

    if (task.name !== undefined) {
        assert(lang.isString(task.name), 'Expected name to be a string in \'' + taskId + '\' task');
        assert(task.name, 'Expected name to not be empty in \'' + taskId + '\' task');
    }
    if (task.author !== undefined) {
        assert(lang.isString(task.author), 'Expected author to be a string in \'' + taskId + '\' task');
        assert(task.author, 'Expected author to not be empty in \'' + taskId + '\' task.');
    }
    if (task.description !== undefined) {
        assert(lang.isString(task.description) || task.description === null, 'Expected description to be a string or null in \'' + taskId + '\' task');
    }
    if (task.setup !== undefined) {
        assert(lang.isFunction(task.setup), 'Expected setup to be a function in \'' + taskId + '\' task');
    }
    if (task.teardown !== undefined) {
        assert(lang.isFunction(task.teardown), 'Expected teardown to be a function in \'' + taskId + '\' task');
    }
    if (task.options !== undefined) {
        assert(lang.isPlainObject(task.options), 'Expected options to be an object in \'' + taskId + '\' task');
        for (x in task.options) {
            curr = task.options[x];
            assert(lang.isPlainObject(curr), 'Expected options definition to be an object in \'' + taskId + '\' task');
            if (curr.description !== undefined) {
                assert(lang.isString(curr.description), 'Expected \'' + x + '\' option description to be a string in \'' + taskId + '\' task');
            }
        }
    } else {
        // TODO:
        task.options = {};
    }

    assert(lang.isArray(task.tasks), 'Expected subtasks to be an array in \'' + taskId + '\' task', true);

    length = task.tasks.length;
    for (x = 0; x < length; ++x) {
        curr = task.tasks[x];

        assert(lang.isPlainObject(curr), 'Expected subtask at index \'' + x + '\' to be an object');
        if (lang.isPlainObject(curr.task)) {
            validate(curr.task);
        } else {
            assert(lang.isString(curr.task) || lang.isFunction(curr.task), 'Expected subtask at index \'' + x + '\' to be a string, a function or a task object in \'' + taskId + '\' task');
        }

        if (curr.description !== undefined) {
            assert(lang.isString(curr.description) || curr.description === null, 'Expected subtask description at index \'' + x + '\' to be a string or null in \'' + taskId + '\' task');
        }
        if (curr.options !== undefined) {
            assert(lang.isPlainObject(curr.options), 'Expected subtask options at index \'' + x + '\' to be an object in \'' + taskId + '\' task');
        }
        if (curr.grunt !== undefined) {
            // TODO:
            assert(lang.isBoolean(curr.grunt) || lang.isPlainObject(curr.grunt), 'Expected subtask grunt at index \'' + x + '\' to be a boolean or an object in \'' + taskId + '\' task');
        }
    }
}

module.exports = validate;