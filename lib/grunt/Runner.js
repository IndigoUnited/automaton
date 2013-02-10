'use strict';

var dejavu       = require('dejavu');
var cp           = require('child_process');
var EventEmitter = require('events').EventEmitter;

var Runner = dejavu.Class.declare({
    $name: 'Runner',

    _queue: [],
    _fork: null,
    _inited: false,

    _keepAliveInterval: 2000,
    _keepAliveIntervalId: null,

    /**
     * Constructor.
     */
    initialize: function () {
        // if this process exits, destroy the worker gracefully
        process.on('SIGTERM', this.kill.$bind(this));
        process.on('SIGINT', this.kill.$bind(this));
        process.on('exit', this.kill.$bind(this));
        process.on('uncaughtException', function (e) {
            this.kill();
            throw e;
        }.$bind(this));
    },

    /**
     * Runs the given grunt task with the given options.
     * When done, calls the callback with the error if any (node style).
     *
     * The task might get queued if there's a task already running.
     * Please note that the task will actually be run in a worker (fork).
     *
     * An EventEmitter is returned.
     * It will emit 'start', 'data', 'error' and 'end' events.
     *
     * @param {String}   name        The task name
     * @param {Object}   [$options]  The task options
     * @param {Object}   [$config]   The grunt config
     * @param {Function} [$callback] The callback
     *
     * @return {EventEmitter} The event emitter
     */
    run: function (name, $options, $config, $callback) {
        var emitter = new EventEmitter();
        emitter.on('error', function () {});  // prevent errors when emitting an uncaught error event

        this._queue.push({
            name: name,
            opts: $options,
            config: $config,
            emitter: emitter,
            cb: $callback || function () {}
        });
        process.nextTick(this._processQueue.$bind(this));

        return emitter;
    },

    /**
     * Kills the underlying grunt worker (gracefully).
     *
     * @return {Runner} Chainable!
     */
    kill: function () {
        if (this._fork) {
            this._inited = false;

            // stop the keep alive
            this._stopKeepAlive();

            // cleanup listeners
            this._fork.removeAllListeners();

            // send exit message if the worker has not exited yet
            if (!this._fork._exited) {
                this._fork.on('error', function () {});
                this._fork.kill();
            }

            this._fork = null;
        }

        return this;
    },

    /**
     * Processes the queue, running the next task if the worker is free.
     * If the worker is not yet created, it will make sure to create it before
     * running any task.
     */
    _processQueue: function () {
        // do nothing if not tasks are queued
        if (this._queue.length) {
            // if the worker is not yet ready, then create it
            if (!this._inited) {
                this._createWorker();
            // process the next task on queue if no task is beeing run
            } else if (!this._current) {
                this._current = this._queue.shift();
                this._current.emitter.emit('start');

                // inform the worker to run it
                this._fork.send({ msg: 'run', task: {
                    name: this._current.name,
                    opts: this._current.opts,
                    config: this._current.config
                }});
            }
        }
    },

    /**
     * Creates and setups the grunt worker (if not already created).
     */
    _createWorker: function () {
        var current,
            err;

        // check if the worker is already spawned but not yet inited
        if (this._fork) {
            return;
        }

        // spawn the worker
        this._fork = cp.fork(__dirname + '/worker', [this._keepAliveInterval * 2], {
            cwd: process.cwd()
        });

        // handle worker messages
        this._fork.on('message', this._onWorkerMessage);

        // caught errors and log them
        this._fork.on('error', function (err) {
            if (this._current) {
                this._current.emitter.emit('error', err);
            }
        }.$bind(this));

        // if the worker exited too early
        this._fork.once('exit', function () {
            if (this._inited) {
                this._fork._exited = true;

                // kill the worker
                this.kill();

                // if there was a task running, report error
                if (this._current) {
                    current = this._current;
                    this._current = null;
                    err = new Error('Grunt runner exited unexpectedly');
                    current.emitter.emit('error', err);
                    current.emitter.emit('end', false);
                    current.cb(err);
                }

                // process next on queue (resume operations)
                this._processQueue();
            }
        }.$bind(this));

        // start keep alive to keep the fork alive
        this._startKeepAlive();
    },

    /**
     * Handles messages coming from the grunt worker.
     *
     * @param {Object} data The message data
     */
    _onWorkerMessage: function (data) {
        var current,
            err;

        // inited message arrived?
        if (data.msg === 'inited') {
            this._inited = true;
            this._processQueue();
        // runned message arrived?
        } else if (data.msg === 'runned') {
            current = this._current;
            this._current = null;
            if (data.code) {
                err = new Error('Failed to run grunt task');
                current.emitter.emit('error', err);
                current.emitter.emit('end', false);
                current.cb(err);
            } else {
                current.emitter.emit('end', true);
                current.cb();
            }
            this._processQueue();
        // write message arrived (log)?
        } else if (data.msg === 'write') {
            if (this._current) {
                this._current.emitter.emit('data', data.data);
            }
        }
    }.$bound(),

    /**
     * Starts the keep alive mechanism to maintain the worker alive.
     * If the worker does not receive any keep alive messages within a certain
     * timeframe, it commits suicide.
     */
    _startKeepAlive: function () {
        this._keepAliveIntervalId = setInterval(function () {
            this._fork.send({ msg: 'keep-alive' });
        }.$bind(this), this._keepAliveInterval);
    },

    /**
     * Stops the keep alive.
     */
    _stopKeepAlive: function () {
        if (this._keepAliveIntervalId) {
            clearInterval(this._keepAliveIntervalId);
            this._keepAliveIntervalId = null;
        }
    }
});

module.exports = Runner;