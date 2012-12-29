var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file')
;

module.exports = function (automaton) {
    describe('symlink', function () {
        it.skip('should create symlink', function (done) {

            var dir      = __dirname + '/../tmp/init/',
                filename = 'autofile.js';

            automaton.run('symlink', {
            }, function (err) {
                if (err) {
                    return done(err);
                }

                expect(isFile(dir + filename)).to.be(true);
                done();
            });
        });
    });
};