var syntax = /\{\{([\w\-]+)\}\}/g;
var syntaxCleanup = /((?:[\r\n])*)\{\{([\w\-]+)\}\}((?:[\r\n])*)/g;
var syntaxUnescape = /\\\{\\\{([\w\-]+)\\\}\\\}/g;

/**
 * String interpolation.
 * Format/replace tokens with object properties.
 *
 * Available options:
 *  - trim         - True to trim new lines in the left or right of the tokens
 *  - purge        - Purges (removes) tokens that have no correspondent values
 *  - skipUnescape - True to unescape escaped placeholders, false otherwise
 *
 * @param {String}  template     The template
 * @param {Object}  replacements The replacements
 * @param {Object}  [options]    The options
 *
 * @return {String} The interpolated string
 */
module.exports = function (template, replacements, options) {
    var interpolated;

    options = options || {};

    if (options.trim) {
        interpolated = template.replace(syntaxCleanup, function (match, leadingSpaces, prop, trailingSpaces) {
            var replacement = (prop in replacements) ? replacements[prop] : (options.purge ? '' : '{{' + match + '}}');
            return leadingSpaces.length ? replacement + trailingSpaces : leadingSpaces + replacement;
        });
    } else {
        interpolated = template.replace(syntax, function (match, prop) {
            return (prop in replacements) ? replacements[prop] : (options.purge ? '' : match);
        });
    }

    return !options.skipUnescape ? interpolated.replace(syntaxUnescape, '{{$1}}') : interpolated;
};

module.exports.syntax = syntax;
module.exports.syntaxCleanup = syntaxCleanup;
module.exports.syntaxUnescape = syntaxUnescape;