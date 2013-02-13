'use strict';

var TaskBuilder  = require('../lib/TaskBuilder'),
    expect       = require('expect.js'),
    taskBuilder
;

module.exports = function () {

    beforeEach(function () {
        taskBuilder = new TaskBuilder();
    });
    afterEach(function () {
        taskBuilder = null;
    });

    describe('TaskBuilder', function () {
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
        });

        it('should create a task with an option that have a description and a default', function () {
            var task = taskBuilder.option('option1', 'description of option1', false).toObject();

            expect(task).to.be.eql({ tasks: [], options: { option1: { description: 'description of option1', default: false } } });
        });

        it('should create a task with a replaced option', function () {
            var task = taskBuilder.option('option1', 'description of option1', false)
                                    .option('option1', 'another description for option1', true)
                                    .toObject();

            expect(task).to.be.eql({ tasks: [], options: { option1: { description: 'another description for option1', default: true } } });
        });

        it('should create a task with a filter', function () {
            var filterFunc = function (opts, ctx, next) { next(); };
            var task = taskBuilder.filter(filterFunc).toObject();

            expect(task).to.be.eql({ tasks: [], filter: filterFunc });
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
            var filterFunc = function (opts, ctx, next) { next(); },
                task = taskBuilder.id('task1')
                                    .name('task_name')
                                    .description('task description')
                                    .author('task author')
                                    .option('option1', 'option description', false)
                                    .filter(filterFunc)
                                    .do('subtask1', { options: {}, mute: true, fatal: false })
                                    .toObject(),
                expectedTask = {
                    id: 'task1',
                    name: 'task_name',
                    description: 'task description',
                    author: 'task author',
                    options: {
                        option1: {
                            description: 'option description',
                            default: false
                        }
                    },
                    filter: filterFunc,
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
};