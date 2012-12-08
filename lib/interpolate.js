var syntax = /\{\{([\w\-]+)\}\}/g;
var syntaxCleanup = /((?:[\r\n])*)\{\{([\w\-]+)\}\}((?:[\r\n])*)/g;

module.exports = function (template, replacements, cleanup) {
    var replaceFn;

    if (cleanup) {
        replaceFn = function (match, leadingSpaces, prop, trailingSpaces) {
            var replacement = (prop in replacements) ? replacements[prop] : '{{' + match + '}}';
            return leadingSpaces.length ? replacement + trailingSpaces : leadingSpaces + replacement;
        };

        return template.replace(syntaxCleanup, replaceFn);
    }

    replaceFn = function (match, prop) {
        return (prop in replacements) ? replacements[prop] : match;
    };

    return template.replace(syntax, replaceFn);
};

module.exports.syntax = syntax;
module.exports.syntaxCleanup = syntaxCleanup;