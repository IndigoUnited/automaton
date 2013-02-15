/*jshint regexp:false*/

'use strict';

var dejavu = require('dejavu');

var TaskBuilder = dejavu.Class.declare({
    $name: 'TaskBuilder',

    _task: {
        tasks: []
    },

    /**
     * Set the task id.
     *
     * @param {String} id The task id.
     *
     * @return {TaskBuilder} Chainable!
     */
    id: function (id) {
        this._task.id = id;

        return this;
    },

    /**
     * Set the task name.
     *
     * @param {String} name The task name.
     *
     * @return {TaskBuilder} Chainable!
     */
    name: function (name) {
        this._task.name = name;

        return this;
    },

    /**
     * Set the task description.
     *
     * @param {String} desc The task description.
     *
     * @return {TaskBuilder} Chainable!
     */
    description: function (desc) {
        this._task.description = desc;

        return this;
    },

    /**
     * Set the task author name.
     *
     * @param {String} author The task author name.
     *
     * @return {TaskBuilder} Chainable!
     */
    author: function (author) {
        this._task.author = author;

        return this;
    },

    /**
     * Set the task required options.
     *
     * @param {String} name       The option name.
     * @param {String} [$desc]    The option description.
     * @param {Mixed}  [$default] The option default.
     *
     * @return {TaskBuilder} Chainable!
     */
    option: function (name, $desc, $default) {
        var option = {};

        if ($desc != null) {
            option.description = $desc;
        }
        if ($default !== undefined) {
            option.default = $default;
        }

        this._task.options = this._task.options || {};
        this._task.options[name] = option;

        return this;
    },

    /**
     * Set the task setup.
     *
     * @param {Function} func The task setup.
     *
     * @return {TaskBuilder} Chainable!
     */
    setup: function (func) {
        this._task.setup = func;

        return this;
    },

    /**
     * Set the task teardown.
     *
     * @param {Function} func The task teardown.
     *
     * @return {TaskBuilder} Chainable!
     */
    teardown: function (func) {
        this._task.teardown = func;

        return this;
    },

    /**
     * Adds a task to be run.
     *
     * @param {String|Function|Object} task      The task.
     * @param {Object}                 [$config] The configuration.
     *
     * @return {TaskBuilder} Chainable!
     */
    do: function (task, $config) {
        $config = $config || {};
        $config.task = task;
        this._task.tasks.push($config);

        return this;
    },

    /**
     * Get the task object.
     *
     * @return {Object} The task.
     */
    toObject: function () {
        return this._task;
    }
});

module.exports = TaskBuilder;
