/*global Documentation*/

// Documentation parsing
(function () {
    var leftColumnEl,
        rightColumnEl;

    function parseBlock(els) {
        var blockEl = $('<div class="block"></div>');
        blockEl.append(els);

        return blockEl;
    }

    function getBlockTitle(els) {
        var first = els.get(0),
            tag = first.tagName.toLowerCase();

        if (tag === 'h1' || tag === 'h2') {
            return first.innerHTML;
        }

        return null;
    }

    function addBlock(els) {
        els = $(els);

        if (leftColumnEl.height() < rightColumnEl.height()) {
            leftColumnEl.append(parseBlock(els));
        } else {
            rightColumnEl.append(parseBlock(els));
        }
    }

    function parseDoc(str) {
        leftColumnEl = $('#content .left'),
        rightColumnEl = $('#content .right');

        var el = $('<div style="display: none"></div>').html(str),
            children,
            length,
            els,
            x,
            tag,
            curr;

        el.find('h1').eq(0).remove();   // Remove the first header
        el.find('p').eq(0).remove();    // Remove first paragraph (the build status image)
        el.find('hr').remove();         // Remove all hr's

        children = el.children(),
        length = children.length,
        els = [];

        for (x = 0; x < length; x += 1) {
            curr = children.get(x);
            tag = curr.tagName.toLowerCase();
            if ((tag === 'h1' || tag === 'h2' || tag === 'h3') && els.length) {
                addBlock(els);
                els = [];
            }

            els.push(curr);
        }

        if (els.length) {
            addBlock(els);
        }
    }

    window.Documentation = {
        parse: parseDoc
    };
}());


$(document).ready(function () {

    // Download the tmpl
    var promise = $.get('tmpl/doc.tmpl', {
        timeout: 15000
    });
    promise.fail(function () {
        $('#content .left').html('Oops, something went wrong.');
    });
    promise.success(function () {
        // Parse it
        Documentation.parse(promise.responseText);

        // Highlight code
        var blocks = $('pre code'),
            length = blocks.length,
            x;

        for (x = 0; x < length; x += 1) {
            hljs.highlightBlock(blocks.get(x));
        }
    });
});