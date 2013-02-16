'use strict';

var cp     = require('child_process');
var expect = require('expect.js');

module.exports = function () {
    describe('CLI', function () {
        this.timeout(10000); // Increase the timeout to let the update-notifier do it's job

        it('should error if task file does not exist', function (done) {
            cp.exec('node bin/automaton something-that-will-never-exist', function (err, stdout, stderr) {
                expect(err).to.be.an(Error);
                expect(err.code).to.equal(1);

                if (process.platform !== 'win32') {  // Windows messes with stdout dunno why
                    expect(stderr).to.match(/could not find/i);
                }

                done();
            });
        });

        it('should exit with an appropriate code on fail/success', function (done) {
            cp.exec('node bin/automaton test/helpers/tasks/dummy-mandatory', function (err, stdout) {
                expect(err).to.be.an(Error);
                expect(err.code).to.equal(1);

                if (process.platform !== 'win32') {  // windows messes with stdout dunno why
                    expect(stdout).to.match(/mandatory/);
                }

                cp.exec('node bin/automaton test/helpers/tasks/dummy-mandatory --mandatory=foo')
                .on('exit', function (code) {
                    expect(code).to.equal(0);
                    done();
                });
            });
        });

        it('should error when showing help of a malformed/non-task file', function (done) {
            cp.exec('node bin/automaton index.js', function (err, stdout, stderr) {
                expect(err).to.be.an(Error);
                expect(err.code).to.equal(1);

                if (process.platform !== 'win32') {  // Windows messes with stdout dunno why
                    expect(stderr).to.match(/unable to get task/i);
                }

                done();
            });
        });
    });
};