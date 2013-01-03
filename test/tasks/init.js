var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file')
;

module.exports = function (automaton) {
    describe('init', function () {
        it('should initialize an empty task - with default autofile name', function (done) {
            var dir      = __dirname + '/../tmp/init/',
                filename = 'autofile.js';

            automaton.run('init', {
                dst: dir
            }, function (err) {
                if (err) {
                    return done(err);
                }

                expect(isFile(dir + filename)).to.be(true);
                done();
            });

        });

        it('should initialize an empty task - with specific autofile name', function (done) {
            var dir      = __dirname + '/../tmp/init/',
                file     = 'autofile_test.js';

            automaton.run('init', {
                name: file,
                dst: dir
            }, function (err) {
                if (err) {
                    return done(err);
                }

                expect(isFile(dir + file)).to.be(true);
                done();
            });
        });

        it.skip('should throw an error if the autofile already exists', function () {
            // test with dst and withouy dstß
        });
    });
};