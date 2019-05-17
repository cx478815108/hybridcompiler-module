const HTMLParser = require("htmlparser2");
const CSSselect  = require("css-select");
const HTMLNode   = require("./HTMLNode");
const Adapter    = require("./HTMLNodeAdapter");

Array.prototype.top = function () {
    const l = this.length;
    return l > 0 ? this[l - 1] : null;
}

module.exports = class HTMLDocument {

    constructor() {
        this.rootNode = null;
    }

    createDOM(htmlText) {
        let nodeStack = [];
        let rootNode = null;
        const parser = new HTMLParser.Parser({
            onopentag: function (tagName, attributes) {
                const node      = new HTMLNode();
                node.tagName    = tagName;
                node.attributes = attributes;
                nodeStack.push(node);

                if (!rootNode) {
                    rootNode = node;
                }
            },
            ontext: function (text) {
                const currentNode = nodeStack.top();
                const t = text.trim();
                if (t.length) {
                    currentNode.text = t;
                }
            },
            onclosetag: function (tagName) {
                const currentNode = nodeStack.pop();
                const parentNode = nodeStack.top();
                if (parentNode) {
                    parentNode.addChildNode(currentNode);
                }
            }
        }, {
            lowerCaseAttributeNames: false,
            lowerCaseTags: false
        });
        parser.write(htmlText);
        parser.end();
        this.rootNode = rootNode;
        return rootNode;
    }

    findAll(query) {
        return CSSselect.selectAll(query, [this.rootNode], {
            adapter: Adapter
        });
    }
}
