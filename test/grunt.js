'use strict';

var expect       = require('expect.js'),
    fs           = require('fs'),
    isDir        = require('./helpers/util/is-dir'),
    isFile       = require('./helpers/util/is-file'),
    removeColors = require('../lib/Logger').removeColors,
    Runner       = require('../lib/grunt/Runner')
;

module.exports = function (automaton) {
    describe('Grunt Runner', function () {
        var runner,
            target = __dirname + '/tmp/grunt/';

        before(function () {
            runner = new Runner();
        });

        beforeEach(function () {
            fs.mkdirSync(target, '0777');
        });


        it('should run grunt tasks', function (next) {
            var opts = {},
                stack = [];

            opts[target] = __dirname + '/helpers/assets/file2';

            runner.run('copy', {
                files: opts
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                stack.push(1);
                expect(isDir(target)).to.be(true);
                expect(isFile(target + 'file2')).to.be(true);
            });

            opts = {};
            opts[target] = __dirname + '/helpers/assets/file1.json';
            runner.run('copy', {
                files: opts
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                stack.push(2);
                expect(isDir(target)).to.be(true);
                expect(isFile(target + 'file1.json')).to.be(true);
                expect(stack).to.eql([1, 2]);

                next();
            });
        });

        it('should emit "start", "data", "error" and "end" events', function (next) {
            var opts = {},
                stack = [],
                stack2 = [],
                emitter;

            opts[target] = __dirname + '/helpers/assets/file2';

            emitter = runner.run('copy', {
                files: opts
            }, null, function (err) {
                if (err) {
                    throw err;
                }

                expect(stack[0]).to.equal('start');
                expect(stack[1]).to.equal('data');
                expect(stack[stack.length - 1]).to.equal('end_0');
                expect(stack.indexOf('error')).to.equal(-1);
            });

            emitter
                .on('start', function () { stack.push('start'); })
                .on('data', function () { stack.push('data'); })
                .on('error', function () { stack.push('error'); })
                .on('end', function (success) { stack.push('end_' + (success ? '0' : '1')); });

            opts = {};
            opts[target] = __dirname + '/helpers/assets/filethatwillneverexist';

            emitter = runner.run('copy', {
                files: opts
            }, null, function (err) {
                expect(err).to.be.an(Error);
                expect(stack2[0]).to.equal('start');
                expect(stack2[stack.length - 2]).to.equal('error');
                expect(stack2[stack.length - 1]).to.equal('end_1');

                next();
            });

            emitter
                .on('start', function () { stack2.push('start'); })
                .on('data', function () { stack2.push('data'); })
                .on('error', function () { stack2.push('error'); })
                .on('end', function (success) { stack2.push('end_' + (success ? '0' : '1')); });
        });

        it('should kill the worker', function (next) {
            this.timeout(5000);

            var opts = {};
            opts[target] = __dirname + '/helpers/assets/file2';

            runner.run('copy', {
                files: opts
            }, null, function () {
                throw new Error('Should have killed!');
            });

            runner.kill();
            setTimeout(next, 4000);
        });
    });

    describe('Grunt integration', function () {
        it.skip('should respect task order');
        it.skip('should log indented output');
        it.skip('should pass grunt config');
        it.skip('should integrate well with options replacement');
        it.skip('should integrate well with fatal');
        it.skip('should integrate well with mute');
        it.skip('should integrate well with on');
    });
};