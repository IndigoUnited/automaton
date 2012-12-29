var cp     = require('child_process');
var expect = require('expect.js');

module.exports = function () {
    it('should exit with an appropriate code', function (done) {
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
};