module.exports = exports = {
    interpolate: function (template, replacements, cleanup) {
        var replaceFn;

        if (cleanup) {
            replaceFn = function (match, leadingSpaces, prop, trailingSpaces) {
                var replacement = (prop in replacements) ? replacements[prop] : '{{' + match + '}}';
                return leadingSpaces.length ? replacement + trailingSpaces : leadingSpaces + replacement;
            };

            return template.replace(/((?:[\r\n])*)\{\{(\w+)\}\}((?:[\r\n])*)/g, replaceFn);
        }

        replaceFn = function (match, prop) {
            return (prop in replacements) ? replacements[prop] : match;
        };

        return template.replace(/\{\{(\w+)\}\}/g, replaceFn);
    }
};
