'use strict';

var expect = require('expect.js');

module.exports = function (automaton) {
    describe('Prompt', function () {
        it('should provide an object attached to the context', function () {
            automaton
                .run({
                    tasks: [
                        {
                            task: function (opts, ctx, next) {
                                expect(ctx.prompt).to.be.an('object');
                                expect(ctx.prompt.prompt).to.be.a('function');
                                next();
                            }
                        }
                    ]
                });
        });
    });
};