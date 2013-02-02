/*jshint regexp:false*/

'use strict';

var dejavu = require('dejavu'),
    colors = require('colors'),
    utils  = require('mout'),
    Stream = require('stream')
;

colors.setTheme({
    automaton_debug:   'white',
    automaton_info:    'white',
    automaton_warn:    'yellow',
    automaton_error:   'red',
    automaton_success: 'green'
});

var Logger = dejavu.Class.declare({
    $name: 'Logger',

    _stream: null,
    _padding: '',
    _depth: 1,
    _muted: false,
    _ln: true,
    _options: {
        verbosity: -1,
        debug: false,
        color: true
    },

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
        if ($options) {
            utils.object.deepMixIn(this._options, $options);
        }

        this._stream = new Stream();
        this._stream.writable = false;
    },

    /**
     * Get the read stream for the logger.
     *
     * @return {Stream} The readonly stream
     */
    getStream: function () {
        return this._stream;
    },

    /**
     * Set the current depth.
     *
     * @param {Number} depth The depth
     *
     * @return {Automaton} Chainable!
     */
    setDepth: function (depth) {
        this._depth = depth < 1 ? 1 : depth;
        this._padding = this._depth > 1 ? utils.string.repeat('  ', this._depth - 1) : '';

        return this;
    },

    /**
     * Mutes the logger.
     *
     * @return {Automaton} Chainable!
     */
    mute: function () {
        this._muted = true;

        return this;
    },

    /**
     * Unmutes the logger.
     *
     * @return {Automaton} Chainable!
     */
    unmute: function () {
        this._muted = false;

        return this;
    },

    /**
     * Logs an info message.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    info: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        return this._log(data.slice(0, -1), 'info');
    },

    /**
     * Logs an info message adding a new line.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    infoln: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._logln(data.slice(0, -1), 'info');

        return this;
    },

    /**
     * Logs a warning message.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    warn: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._log(data.slice(0, -1), 'warn');

        return this;
    },

    /**
     * Logs a warning message adding a new line.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining
     */
    warnln: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._logln(data.slice(0, -1), 'warn');

        return this;
    },

    /**
     * Logs an error message.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    error: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._log(data.slice(0, -1), 'error');

        return this;
    },

    /**
     * Logs an error message adding a new line.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    errorln: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._logln(data.slice(0, -1), 'error');

        return this;
    },

    /**
     * Logs an success message.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    success: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._log(data.slice(0, -1), 'success');

        return this;
    },

    /**
     * Logs an success message adding a new line.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    successln: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._logln(data.slice(0, -1), 'success');

        return this;
    },

    /**
     * Logs a debug message.
     * It will only actually log if the debug option is enabled.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    debug: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._log(data.slice(0, -1), 'debug', true);

        return this;
    },

    /**
     * Logs a debug message adding a new line.
     * It will only actually log if the debug option is enabled.
     *
     * @param {Mixed} ..data The data to log
     *
     * @return {Logger} Chaining!
     */
    debugln: function () {
        var data = '';

        utils.lang.toArray(arguments).forEach(function (arg) {
            data += arg + ' ';
        }, this);

        this._logln(data.slice(0, -1), 'debug', true);

        return this;
    },

    /**
     * Removes any colors (and aditional styles) from a string.
     *
     * @param {String} str The string to strip colors and styles from
     *
     * @return {String} The uncolored string
     */
    uncolor: function (str) {
        return this.$static.removeColors(str);
    },

    /**
     * Indents a string with new lines in the corpus.
     *
     * @param {String} str The string
     *
     * @return {String} The indented string
     */
    _indent: function (str) {
        return str.replace(/(\r?)\n(.+?)/gm, '$1\n' + this._padding + '$2');
    },

    /**
     * Checks if a message should be really logged.
     * Debug, depth and verbosity are taken into account.
     *
     * @param {Boolean} [$debug] True if it's a debug message, false otherwise (default to false)
     *
     * @return {Boolean} True if it should be logged, false otherwise
     */
    _checkLevel: function ($debug) {
        if ($debug && !this._options.debug) {
            return false;
        }

        return this._options.verbosity === -1 || this._depth <= this._options.verbosity;
    },

    /**
     * Logs a message.
     *
     * @param  {Mixed}   data     The data to log
     * @param  {String}  type     The type of the message (info, success, etc)
     * @param  {Boolean} [$debug] True if it is a debug message, false otherwise
     */
    _log: function (data, type, $debug) {
        if (!this._muted && this._checkLevel($debug)) {
            if (this._ln) {
                data = this._padding + data;
                this._ln = false;
            }

            data = this._indent(data + '');
            data = !this._options.color ? this.uncolor(data) : data['automaton_' + type];
            this._stream.emit('data', data);
        }
    },

    /**
     * Logs a message with a new line at the end.
     *
     * @param  {Mixed}   data     The data to log
     * @param  {String}  type     The type of the message (info, success, etc)
     * @param  {Boolean} [$debug] True if it is a debug message, false otherwise
     */
    _logln: function (data, type, $debug) {
        if (!this._muted && this._checkLevel($debug)) {
            this._ln = true;

            data = this._padding + this._indent(data + '');
            data = !this._options.color ? this.uncolor(data) : data['automaton_' + type];
            this._stream.emit('data', data + '\n');
        }
    },

    $statics: {
        /**
         * Removes any colors (and aditional styles) from a string.
         *
         * @param {String} str The string to strip colors and styles from
         *
         * @return {String} The uncolored string
         */
        removeColors: function (str) {
            return str.replace(/\x1B\[\d+m/g, '');
        }
    }
});

module.exports = Logger;