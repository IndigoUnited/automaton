'use strict';

var interpolate = require('./interpolate');

var flags = '';
flags += interpolate.syntax.multiline ? 'm' : '';
flags += interpolate.global ? 'g' : '';
flags += interpolate.ignoreCase ? 'i' : '';
var regExp = new RegExp('^' + interpolate.syntax.source + '$', flags);

/**
 * String interpolation with casting.
 * Similar to the normal interpolation but if the template contains only
 * a token and the value is available, the value will be returned.
 * This way tokens that have values other than strings will be returned instead.
 *
 * @param {String} template     The template
 * @param {Object} replacements The replacements
 * @param {Object} [options]    The options
 *
 * @return {Mixed} The interpolated string or the real token value
 */
module.exports = function (template, replacements, options) {
    var matches = template.match(regExp),
        placeholder;

    if (matches) {
        placeholder = matches[1];

        // Attempt to cast it
        if (replacements.hasOwnProperty(placeholder)) {
            return replacements[placeholder];
        }

        // Handle not (!) (note that !foo! is ignored but !foo isn't)
        if (/^!+?[^!]+$/.test(placeholder)) {
            placeholder = placeholder.replace(/!!+/, '');

            return placeholder.charAt(0) === '!' ? !placeholder.substr(1) : !!placeholder.substr(1);
        }
    }

    return interpolate(template, replacements, options);
};