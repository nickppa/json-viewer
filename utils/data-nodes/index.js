const FalseNode = require("./false-node");
const NullNode = require("./null-node");
const NumNode = require("./num-node");
const StringNode = require("./string-node");
const TrueNode = require("./true-node");
const UndefinedNode = require("./undefined-node");
const { EMPTYCHARS } = require("./EMPTYCHARS");

class DataNode {
    constructor() {
        this.falseNode = new FalseNode();
        this.nullNode = new NullNode();
        this.numNode = new NumNode();
        this.stringNode = new StringNode();
        this.trueNode = new TrueNode();
        this.undefinedNode = new UndefinedNode();

        this.nodes = [
            this.falseNode,
            this.nullNode,
            this.numNode,
            this.trueNode,
            this.undefinedNode,
        ];
        this.init();
    }

    init() {
        this.isBegin = true;
        this.curNode = null;
    }

    changeMode(mode) {
        this.mode = mode;
    }

    hasValue() {
        return this.curNode && this.curNode.hasValue();
    }

    isInString() {
        return this.curNode && this.curNode.isInString();
    }

    // return isBegin
    append(chr) {
        let isBegining = false;
        if (this.isBegin) {
            if (EMPTYCHARS.has(chr)) {
                return false;
            }
            if (this.mode === "v") {
                for (const n of this.nodes) {
                    if (n.is(chr)) {
                        this.curNode = n;
                        break;
                    }
                }
                if (!this.curNode) {
                    this.curNode = this.stringNode;
                }
                this.curNode.init();
                this.isBegin = false;
            } else {
                this.curNode = this.stringNode;
                this.curNode.init();
                this.isBegin = false;
            }
            isBegining = true;
        }
        if (this.curNode.addChar(chr)) {
            this.stringNode.init(this.curNode.text);
            this.curNode = this.stringNode;
            this.curNode.addChar(chr);
        }
        return isBegining;
    }

    getText() {
        const result = this.curNode.getText();
        this.init();
        return result;
    }
}

const dataNode = new DataNode();
module.exports = dataNode;

