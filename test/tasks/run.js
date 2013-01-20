'use strict';

var expect = require('expect.js'),
    path   = require('path'),
    isDir  = require('../helpers/util/is-dir')
;

module.exports = function (automaton) {
    describe('run', function () {
        it('should run command', function (done) {
            var dir = path.normalize(__dirname + '/../tmp/run');

            automaton.run('run', {
                cmd: 'mkdir ' + dir
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dir)).to.be(true);
                done();
            });
        });

        it('should run command in a different cwd', function (done) {
            var dir    = __dirname + '/../tmp/',
                folder = 'run';

            automaton.run('run', {
                cmd: 'mkdir  ' + folder,
                cwd: dir
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(dir + folder)).to.be(true);
                done();
            });
        });
    });
};