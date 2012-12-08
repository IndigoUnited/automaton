var syntax = /\{\{([\w\-]+)\}\}/g;
var syntaxCleanup = /((?:[\r\n])*)\{\{([\w\-]+)\}\}((?:[\r\n])*)/g;
var syntaxUnescape = /\\\{\\\{([\w\-]+)\\\}\\\}/g;

module.exports = function (template, replacements, cleanup) {
    var interpolated;

    if (cleanup) {
        interpolated = template.replace(syntaxCleanup, function (match, leadingSpaces, prop, trailingSpaces) {
            var replacement = (prop in replacements) ? replacements[prop] : '{{' + match + '}}';
            return leadingSpaces.length ? replacement + trailingSpaces : leadingSpaces + replacement;
        });
    } else {
        interpolated = template.replace(syntax, function (match, prop) {
            return (prop in replacements) ? replacements[prop] : match;
        });
    }

    // Escaped chars should be unescaped
    return interpolated.replace(syntaxUnescape, '{{$1}}');
};

module.exports.syntax = syntax;
module.exports.syntaxCleanup = syntaxCleanup;
module.exports.syntaxUnescape = syntaxUnescape;