/*jshint regexp:false*/

var dejavu = require('dejavu');
var colors = require('colors');
var utils  = require('amd-utils');
var Stream = require('stream');

colors.setTheme({
    info:    'white',
    warning: 'yellow',
    error:   'red',
    success: 'green'
});

var Logger = dejavu.Class.declare({
    $name: 'Logger',

    _stream: null,
    _padding: '',
    _depth: 1,
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
     * Get the readable stream for the logger.
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
        this._depth = depth;
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
        if (this._checkLevel($debug)) {
            data = this._indent(data + '');
            this._stream.emit('data', this._padding + data);
        }

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
        return this.info(data + '\n', $debug);
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
        if (this._checkLevel($debug)) {
            data = this._indent(data + '');
            this._stream.emit('data', (this._padding + data).warning);
        }

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
        return this.warn(data + '\n', $debug);
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
        if (this._checkLevel($debug)) {
            data = this._indent(data + '');
            this._stream.emit('data', (this._padding + data).error);
        }

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
        return this.error(data + '\n', $debug);
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
        if (this._checkLevel($debug)) {
            data = data + '';
            this._stream.emit('data', (this._padding + data).success);
        }

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
        return this.success(data + '\n', $debug);
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
     * Logs an info message.
     *
     * @param  {Mixed}  data     The data to log
     * @param  {$debug} [$debug] True if this message is a debug one
     *
     * @return {Logger} Chaining
     */
    _checkLevel: function (debug, $depth, $verbosity) {
        if (debug && !this._options.debug) {
            return false;
        }

        if ($depth == null) {
            $depth = this._depth;
        }

        if ($verbosity == null) {
            $verbosity = this._options.verbosity;
        }

        return $verbosity === -1 || $depth <= $verbosity;
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