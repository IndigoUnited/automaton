/*jshint regexp:false*/

var dejavu = require('dejavu');
var colors = require('colors');
var utils  = require('amd-utils');
var Stream = require('stream');

colors.setTheme({
    info:    'white',
    warn:    'yellow',
    error:   'red',
    success: 'green'
});

var Logger = dejavu.Class.declare({
    $name: 'Logger',

    _stream: null,
    _padding: '',
    _depth: 1,
    _ln: true,
    _options: {
        verbosity: -1,
        debug: false
    },

    /**
     * Constructor.
     *
     * Available options:
     *  - verbosity - 0 means no logging
     *                1 means only 1 deep level tasks and so on..
     *                -1 means log every level
     *  - debug     - true to log debug messages, false otherwise
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
     * Logs an info message.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    info: function (data, $debug) {
        this._log(data, 'info', $debug);

        return this;
    },

    /**
     * Logs an info message adding a new line.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    infoln: function (data, $debug) {
        this._logln(data, 'info', $debug);

        return this;
    },

    /**
     * Logs a warning message.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    warn: function (data, $debug) {
        this._log(data, 'warn', $debug);

        return this;
    },

    /**
     * Logs a warning message adding a new line.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining
     */
    warnln: function (data, $debug) {
        this._logln(data, 'warn', $debug);

        return this;
    },

    /**
     * Logs an info message.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    error: function (data, $debug) {
        this._log(data, 'error', $debug);

        return this;
    },

    /**
     * Logs an info message.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    errorln: function (data, $debug) {
        this._logln(data, 'error', $debug);

        return this;
    },

    /**
     * Logs an info message.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    success: function (data, $debug) {
        this._log(data, 'success', $debug);

        return this;
    },

    /**
     * Logs an info message.
     *
     * @param {Mixed}   data     The data to log
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    successln: function (data, $debug) {
        this._logln(data, 'success', $debug);

        return this;
    },

    /**
     * Logs a line.
     *
     * @param {Boolean} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining!
     */
    ln: function ($debug) {
        if (this._checkLevel($debug)) {
            this._stream.emit('data', '\n');
        }

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
        if (this._checkLevel($debug)) {
            if (this._ln) {
                data = this._padding + data;
                this._ln = false;
            }

            data = this._indent(data + '');
            this._stream.emit('data', data[type]);
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
        if (this._checkLevel($debug)) {
            data = this._padding + this._indent(data + '');
            this._ln = true;

            this._stream.emit('data', data[type] + '\n');
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