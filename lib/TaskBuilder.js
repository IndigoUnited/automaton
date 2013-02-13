/*jshint regexp:false*/

'use strict';

var dejavu = require('dejavu');

var TaskBuilder = dejavu.Class.declare({
    $name: 'TaskBuilder',

    _task: null,

    /**
     *
     */
    initialize: function () {
        this._task = {
            tasks: []
        };
    },

    /**
     * Set the task id.
     *
     * @param  {String} id The task id.
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
     * @param  {String} name The task name.
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
     * @param  {String} desc The task description.
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
     * @param  {String} author The task author name.
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
     * @param  {String} name       The option name.
     * @param  {String} [$desc]    The option description.
     * @param  {Mixed}  [$default] The option default.
     *
     * @return {TaskBuilder} Chainable!
     */
    option: function (name, $desc, $default) {
        var option = {};

        if (this._task.options === undefined) {
            this._task.options = {};
        }

        if ($desc !== undefined && $desc !== null) {
            option.description = $desc;
        }
        if ($default !== undefined && $default !== null) {
            option.default = $default;
        }

        this._task.options[name] = option;

        return this;
    },

    /**
     * Set the task filter.
     *
     * @param  {Function} func The task filter.
     *
     * @return {TaskBuilder} Chainable!
     */
    filter: function (func) {
        this._task.filter = func;

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