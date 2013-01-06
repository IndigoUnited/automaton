var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file'),
    isDir  = require('../helpers/util/is-dir'),
    fs     = require('fs')
;

module.exports = function (automaton) {
    describe('symlink', function () {

        var target = __dirname + '/../tmp/symlink/';

        beforeEach(function () {
            fs.mkdirSync(target, '0777');
        });

        it('should create symlink for files', function (done) {
            var dst = target + 'base_autofile.js';

            automaton.run('symlink', {
                dst: dst,
                src: __dirname + '/../../base_autofile.js',
                type: 'file'
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isFile(dst)).to.be(true);
                done();
            });
        });

        it('should create symlink for directories', function (done) {
            automaton.run('symlink', {
                dst: target + 'tasks',
                src: __dirname + '/../../tasks/',
                type: 'dir'
            }, function (err) {
                if (err) {
                    throw err;
                }

                expect(isDir(target + 'tasks')).to.be(true);
                done();
            });

        });
    });
};