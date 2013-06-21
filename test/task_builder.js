/*global describe, it, beforeEach, afterEach*/

'use strict';

var TaskBuilder  = require('../lib/TaskBuilder');
var expect       = require('expect.js');
var callbackTask = require('./helpers/tasks/callback-builder');

var taskBuilder;

module.exports = function (automaton) {
    beforeEach(function () {
        taskBuilder = new TaskBuilder();
    });
    afterEach(function () {
        taskBuilder = null;
    });

    describe('Task builder', function () {
        describe('Builder', function () {
            it('should create a task with an id', function () {
                var task = taskBuilder.id('task1').toObject();

                expect(task).to.be.eql({ tasks: [], id: 'task1' });
            });

            it('should create a task with a name', function () {
                var task = taskBuilder.name('task_name').toObject();

                expect(task).to.be.eql({ tasks: [], name: 'task_name' });
            });

            it('should create a task with a description', function () {
                var task = taskBuilder.description('task description').toObject();

                expect(task).to.be.eql({ tasks: [], description: 'task description' });
            });

            it('should create a task with an author', function () {
                var task = taskBuilder.author('author name').toObject();

                expect(task).to.be.eql({ tasks: [], author: 'author name' });
            });

            it('should create a task with an option', function () {
                var task = taskBuilder.option('option1').toObject();

                expect(task).to.be.eql({ tasks: [], options: { option1: {} } });
            });

            it('should create a task with an option that have a description', function () {
                var task = taskBuilder.option('option1', 'description of option1').toObject();

                expect(task).to.be.eql({ tasks: [], options: { option1: { description: 'description of option1' } } });
            });

            it('should create a task with an option that have a default', function () {
                var task = taskBuilder.option('option1', null, false).toObject();

                expect(task).to.be.eql({ tasks: [], options: { option1: { default: false } } });
                taskBuilder.option('option1', null, null).toObject();
                expect(task).to.be.eql({ tasks: [], options: { option1: { default: null } } });
            });

            it('should create a task with an option that have a description and a default', function () {
                var task = taskBuilder.option('option1', 'description of option1', false).toObject();

                expect(task).to.be.eql({ tasks: [], options: { option1: { default: false, description: 'description of option1' } } });
            });

            it('should create a task with a replaced option', function () {
                var task = taskBuilder.option('option1', 'description of option1', false)
                                        .option('option1', 'another description for option1', true)
                                        .toObject();

                expect(task).to.be.eql({ tasks: [], options: { option1: { default: true, description: 'another description for option1' } } });
            });

            it('should create a task with setup', function () {
                var setupFunc = function (opts, ctx, next) { next(); },
                    task = taskBuilder.setup(setupFunc).toObject();

                expect(task).to.be.eql({ tasks: [], setup: setupFunc });
            });

            it('should create a task with teardown', function () {
                var teardownFunc = function (opts, ctx, next) { next(); },
                    task = taskBuilder.teardown(teardownFunc).toObject();

                expect(task).to.be.eql({ tasks: [], teardown: teardownFunc });
            });

            it('should create a task with a subtask', function () {
                var task = taskBuilder.do('subtask1').toObject();

                expect(task).to.be.eql({ tasks: [ { task: 'subtask1' } ] });
            });

            it('should create a task with a subtask that have a configuration', function () {
                var task = taskBuilder.do('subtask1', { options: {}, mute: true, fatal: false }).toObject();

                expect(task).to.be.eql({ tasks: [ { task: 'subtask1', options: {}, mute: true, fatal: false } ] });
            });

            it('should create a complete task', function () {
                var setupFunc = function (opts, ctx, next) { next(); },
                    teardownFunc = function (opts, ctx, next) { next(); },
                    task = taskBuilder.id('task1')
                                        .name('task_name')
                                        .description('task description')
                                        .author('task author')
                                        .option('option1', 'option description', false)
                                        .setup(setupFunc)
                                        .teardown(teardownFunc)
                                        .do('subtask1', { options: {}, mute: true, fatal: false })
                                        .toObject(),

                    expectedTask = {
                        id: 'task1',
                        name: 'task_name',
                        description: 'task description',
                        author: 'task author',
                        options: {
                            option1: {
                                default: false,
                                description: 'option description',
                            }
                        },
                        setup: setupFunc,
                        teardown: teardownFunc,
                        tasks: [
                            {
                                task: 'subtask1',
                                options: {},
                                mute: true,
                                fatal: false
                            }
                        ]
                    };

                expect(task).to.be.eql(expectedTask);
            });
        });

        describe('TaskBuilder integration', function () {
            it('should run built tasks by id', function (done) {
                var ok = false;

                automaton.run({
                    tasks: [
                        {
                            task: 'callback-builder',
                            options: {
                                callback: function () {
                                    ok = true;
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(ok).to.equal(true);
                    done();
                });
            });

            it('should run built tasks directly by id', function (done) {
                var ok = false;

                automaton.run('callback-builder', {
                    callback: function () {
                        ok = true;
                    }
                }, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(ok).to.equal(true);
                    done();
                });
            });

            it('should run built tasks reference', function (done) {
                var ok = false;

                automaton.run({
                    tasks: [
                        {
                            task: callbackTask,
                            options: {
                                callback: function () {
                                    ok = true;
                                }
                            }
                        }
                    ]
                }, null, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(ok).to.equal(true);
                    done();
                });
            });

            it('should run built tasks directly by reference', function (done) {
                var ok = false;

                automaton.run(callbackTask, {
                    callback: function () {
                        ok = true;
                    }
                }, function (err) {
                    if (err) {
                        throw err;
                    }

                    expect(ok).to.equal(true);
                    done();
                });
            });
        });
    });
};