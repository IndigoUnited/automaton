var syntax = /\{\{([\w\-]+)\}\}/g;
var syntaxCleanup = /((?:[\r\n])*)\{\{([\w\-]+)\}\}((?:[\r\n])*)/g;

module.exports = function (template, replacements, cleanup) {
    if (cleanup) {
        return template.replace(syntaxCleanup, function (match, leadingSpaces, prop, trailingSpaces) {
            var replacement = (prop in replacements) ? replacements[prop] : '{{' + match + '}}';
            return leadingSpaces.length ? replacement + trailingSpaces : leadingSpaces + replacement;
        });
    }

    return template.replace(syntax, function (match, prop) {
        return (prop in replacements) ? replacements[prop] : match;
    });
};

module.exports.syntax = syntax;
module.exports.syntaxCleanup = syntaxCleanup;