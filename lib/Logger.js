/*jshint regexp:false*/

var dejavu = require('dejavu');
var colors = require('colors');
var utils  = require('amd-utils');

colors.setTheme({
    info:    'white',
    warning: 'yellow',
    error:   'red',
    success: 'green'
});

var Logger = dejavu.Class.declare({
    $name: 'Logger',

    _padding: '',
    _depth: 1,
    _options: {
        stdout: process.stdout,
        stderr: process.stderr,
        verbosity: -1,
        debug: false
    },

    /**
     * Constructor.
     *
     * Available options:
     *  - stdout    - a stream to write log messages (defaults to process.stdout, null to disable)
     *  - stderr    - a stream to write error log messages (defaults to process.stdout, null to disable)
     *  - verbosity - 0 means no logging
     *                1 means only 1 deep level tasks and so on..
     *                -1 means log every level
     *  - debug     - true to log debug messages, false otherwise
     *
     * @param {Stream} stdout     The stdout stream
     * @param {Stream} stderr     The stderr stream
     * @param {Object} [$options] The options
     */
    initialize: function ($options) {
        if ($options) {
            utils.object.deepMixIn(this._options, $options);
        }
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
            data = this._indent(data.toString());
            if (this._options.stdout) {
                this._options.stdout.write(this._padding + data);
            }
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
        return this.info(data.toString() + '\n', $debug);
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
            data = this._indent(data.toString());
            if (this._options.stdout) {
                this._options.stdout.write((this._padding + data).warning);
            }
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
        return this.warn(data.toString() + '\n', $debug);
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
            data = this._indent(data.toString());
            if (this._options.stderr) {
                this._options.stderr.write((this._padding + data).error);
            }
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
        return this.error(data.toString() + '\n', $debug);
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
            data = data.toString();
            if (this._options.stdout) {
                this._options.stdout.write((this._padding + data).success);
            }
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
        return this.success(data.toString() + '\n', $debug);
    },

    /**
     * Removes any colors (and aditional styles) from a string.
     *
     * @param {String} str The string to strip colors and styles from
     *
     * @return {String} The uncolored string
     */
    uncolor: function (str) {
        return str.replace(/\x1B\[\d+m/g, '');
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
    }
});

module.exports = Logger;