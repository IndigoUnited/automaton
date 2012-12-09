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
 * @param {String}   template     The template
 * @param {Object}  replacements The replacements
 * @param {Object}  [options]    The options
 *
 * @return {Mixed} The interpolated string or the real token value
 */
module.exports = function (template, replacements, options) {
    var matches = template.match(regExp);
    if (matches && replacements.hasOwnProperty(matches[1])) {
        return replacements[matches[1]];
    }

    options = options || {};

    return interpolate(template, replacements, options);
};