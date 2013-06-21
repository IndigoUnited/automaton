'use strict';

var cp           = require('child_process');
var EventEmitter = require('events').EventEmitter;

/**
 * Runner.
 */
function Runner() {
    this._queue = [];
    this._keepAliveInterval = 2000;

    this.kill = this.kill.bind(this);
    this._onWorkerMessage = this._onWorkerMessage.bind(this);
}

/**
 * Runs the given grunt task with the given options.
 * The task might get queued if there's a task already running.
 * Please note that the task will actually be run in a worker (fork).
 *
 * An EventEmitter is returned.
 * It will emit 'start', 'data', 'error' and 'end' events.
 * If the task was successful, the 'end' event has no arguments,
 * otherwise the first one is the actual error.
 *
 * @param {String} name      The task name
 * @param {Object} [options] The task options
 * @param {Object} [config]  The grunt config
 *
 * @return {EventEmitter} The event emitter
 */
Runner.prototype.run = function (name, options, config) {
    var emitter = new EventEmitter();
    emitter.on('error', function () {});  // prevent errors when emitting an uncaught error event

    this._queue.push({
        name: name,
        opts: options,
        config: config,
        emitter: emitter
    });
    process.nextTick(this._processQueue.bind(this));

    return emitter;
};

/**
 * Kills the underlying grunt worker (gracefully).
 * It also clears the task queue.
 *
 * @return {Runner} Chainable!
 */
Runner.prototype.kill = function () {
    this._killWorker();

    this._queue = [];
    this._current = null;
    this._detachSignals();

    return this;
};

/**
 * Processes the queue, running the next task if the worker is free.
 * If the worker is not yet created, it will be created before running any task.
 */
Runner.prototype._processQueue = function () {
    // do nothing if no tasks are queued or if a task is being run
    if (this._queue.length) {
        if (!this._current) {
            this._attachSignals();
            this._current = this._queue.shift();

            // if the worker is not yet ready, then create it
            if (!this._inited) {
                this._createWorker();
            // otherwise run the task
            } else {
                this._current.emitter.emit('start');

                // inform the worker to run it
                this._fork.send({ msg: 'run', task: {
                    name: this._current.name,
                    opts: this._current.opts,
                    config: this._current.config
                }});
            }
        }
    } else {
        this._detachSignals();
    }
};

/**
 * Creates and setups the grunt worker (if not already created).
 */
Runner.prototype._createWorker = function () {
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

    // if the worker exited too early
    this._fork.once('exit', function () {
        this._fork._exited = true;

        // kill the worker
        this._killWorker();

        // if there was a task running, report end with error
        if (this._current) {
            this._current.emitter.emit('end', new Error('Grunt runner exited unexpectedly'));
            this._current = null;
        }

        // process next on queue (resume operations)
        this._processQueue();
    }.bind(this));

    // start keep alive to keep the fork alive
    this._startKeepAlive();
};

/**
 * Kills the worker.
 */
Runner.prototype._killWorker = function () {
    if (!this._fork) {
        return;
    }

    this._inited = false;

    // stop the keep alive
    this._stopKeepAlive();

    // cleanup listeners
    this._fork.removeAllListeners();

    // kill the worker if it hasn't exited yet
    if (!this._fork._exited) {
        this._fork.on('error', function () {}); // this is just to prevent signaling errors
        this._fork.kill();
    }

    this._fork = null;
};

/**
 * Handles messages coming from the grunt worker.
 *
 * @param {Object} data The message data
 */
Runner.prototype._onWorkerMessage = function (data) {
    // init message arrived?
    if (data.msg === 'init') {
        this._inited = true;
        if (this._current) {
            this._queue.unshift(this._current);
            this._current = null;
        }
        this._processQueue();
    // end message arrived?
    } else if (data.msg === 'end') {
        this._current.emitter.emit('end');
        this._current = null;
        this._processQueue();
    // log message arrived?
    } else if (data.msg === 'log') {
        if (this._current) {
            this._current.emitter.emit('data', data.data);
        }
    // error message arrived?
    } else if (data.msg === 'error') {
        if (this._current) {
            this._current.emitter.emit('error', new Error(data.data));
            this._current = null;
        }

        this._killWorker();
        this._processQueue();
    }
};

/**
 * Attaches signals to the process in order to kill the worker.
 */
Runner.prototype._attachSignals = function () {
    if (!this._signals) {
        // if this process exits, destroy the worker gracefully
        if (process.platform !== 'win32') {
            process.on('SIGTERM', this.kill);
            process.on('SIGINT', this.kill);
        }
        process.on('exit', this.kill);

        this._signals = true;
    }
};

/**
 * Removes any previously attached signals to the process.
 */
Runner.prototype._detachSignals = function () {
    if (this._signals) {
        if (process.platform !== 'win32') {
            process.removeListener('SIGTERM', this.kill);
            process.removeListener('SIGINT', this.kill);
        }
        process.removeListener('exit', this.kill);

        this._signals = false;
    }
};

/**
 * Starts the keep alive mechanism to maintain the worker alive.
 * If the worker does not receive any keep alive messages within a certain
 * time-frame, it commits suicide.
 */
Runner.prototype._startKeepAlive = function () {
    this._keepAliveIntervalId = setInterval(function () {
        this._fork.send({ msg: 'keep-alive' });
    }.bind(this), this._keepAliveInterval);
};

/**
 * Stops the keep alive.
 */
Runner.prototype._stopKeepAlive = function () {
    if (this._keepAliveIntervalId) {
        clearInterval(this._keepAliveIntervalId);
        this._keepAliveIntervalId = null;
    }
};

module.exports = Runner;
