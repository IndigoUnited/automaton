'use strict';

var mout = require('mout');

var syntax = /\{\{(\S+?)\}\}/g;
var syntaxCleanup = /((?:[\r\n])*)\{\{(\S+?)\}\}((?:[\r\n])*)/g;
var syntaxUnescape = /\\\{\\\{(\S+)\\\}\\\}/g;

/**
 * String interpolation.
 * Format/replace tokens with object properties.
 *
 * Available options:
 *  - trim         - True to trim new lines in the left or right of the tokens
 *  - purge        - Purges (removes) tokens that have no correspondent values
 *  - skipUnescape - True to not unescape escaped placeholders, false otherwise
 *
 * @param {String} template     The template
 * @param {Object} replacements The replacements
 * @param {Object} [options]    The options
 *
 * @return {String} The interpolated string
 */
function interpolate(template, replacements, options) {
    var interpolated;

    options = options || {};

    if (options.trim) {
        interpolated = template.replace(syntaxCleanup, function (match, leadingSpaces, prop, trailingSpaces) {
            var replacement = mout.object.has(replacements, prop) ? mout.object.get(replacements, prop) : (options.purge ? '' :  match);
            return leadingSpaces.length ? replacement + trailingSpaces : leadingSpaces + replacement;
        });
    } else {
        interpolated = template.replace(syntax, function (match, prop) {
            return mout.object.has(replacements, prop) ? mout.object.get(replacements, prop) : (options.purge ? '' : match);
        });
    }

    return !options.skipUnescape ? interpolated.replace(syntaxUnescape, '{{$1}}') : interpolated;
}

interpolate.syntax = syntax;
interpolate.syntaxCleanup = syntaxCleanup;
interpolate.syntaxUnescape = syntaxUnescape;

module.exports = interpolate;
