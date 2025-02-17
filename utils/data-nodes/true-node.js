const { EMPTYCHARS } = require("./EMPTYCHARS");

const low = "true";
const upper = "TRUE";
const maxIndex = 3;
const text = "true";
const chars = ["t", "T"];

class TrueNode {
    constructor() {
        this.init();
    }

    init() {
        this.text = "";
        this.index = 0;
    }

    is(firstChr) {
        return chars.includes(firstChr);
    }

    addChar(chr) {
        if (this.index > maxIndex) {
            if (EMPTYCHARS.has(chr)) {
                return;
            }
            return true;
        }
        if (low[this.index] === chr || upper[this.index] === chr) {
            this.text += chr;
            this.index++;
        } else {
            return true;
        }
    }

    getText() {
        if (this.index <= maxIndex) {
            return {
                text: `"${this.text}"`,
                value: this.text,
                ptext: `"${this.text}"`,
            };
        }
        return { text, value: true, ptext: text };
    }

    hasValue() {
        return !!this.text;
    }

    isInString() {
        return false;
    }
}

module.exports = TrueNode;
