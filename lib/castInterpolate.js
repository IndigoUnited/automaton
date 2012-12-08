var interpolate = require('./interpolate');

var flags = '';
flags += interpolate.syntax.multiline ? 'm' : '';
flags += interpolate.global ? 'g' : '';
flags += interpolate.ignoreCase ? 'i' : '';
var regExp = new RegExp('^' + interpolate.syntax.source + '$', flags);

// This function is similar to interpolate but if the template contains only
// a placeholder and its available is in the replacements object, then the real replacement value is returned
// instead (e.g.: {{is_it_true}}) with { is_it_true: true } will return true instead of "true")
module.exports = function (template, replacements) {
    var matches = template.match(regExp);
    if (matches && replacements.hasOwnProperty(matches[1])) {
        return replacements[matches[1]];
    }

    return interpolate(template, replacements);
};