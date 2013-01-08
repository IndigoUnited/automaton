'use strict';

var expect = require('expect.js'),
    isFile = require('../helpers/util/is-file'),
    fs     = require('fs')
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
                    throw err;
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
                    throw err;
                }

                expect(isFile(dir + file)).to.be(true);
                done();
            });
        });

        it('should throw an error if the autofile already exists', function (done) {
            var dir      = __dirname + '/../tmp/init/',
                file     = 'autofile_exists.js';

            // create dir
            fs.mkdirSync(dir);

            // create file
            fs.writeFileSync(dir + file, 'dummy');

            automaton.run('init', {
                name: file,
                dst: dir
            }, function (err) {
                expect(err !== null).to.be(true);
                done();
            });
        });
    });
};