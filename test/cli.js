'use strict';

var cp     = require('child_process');
var expect = require('expect.js');

module.exports = function () {
    describe('CLI', function () {
        this.timeout(10000); // Increase the timeout to let the update-notifier do it's job

        it('should error if task file does not exist', function (done) {
            cp.exec('node bin/automaton something-that-will-never-exist', function (err, stdout, stderr) {
                expect(stderr).to.match(/could not find/i);
            }).on('exit', function (code) {
                expect(code).to.equal(1);
                done();
            });
        });

        it('should exit with an appropriate code if a task fails', function (done) {
            cp.exec('node bin/automaton test/helpers/tasks/dummy-mandatory', function (err, stdout) {
                expect(stdout).to.match(/mandatory/);
            }).on('exit', function (code) {
                expect(code).to.equal(1);

                cp.exec('node bin/automaton test/helpers/tasks/dummy-mandatory --mandatory=foo')
                  .on('exit', function (code) {
                    expect(code).to.equal(0);
                    done();
                });
            });
        });
    });
};