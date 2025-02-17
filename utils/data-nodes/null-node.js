const { EMPTYCHARS } = require("./EMPTYCHARS");

const texts = ['null', 'none', 'nil'];
const text = "null";
const chars = ["n", "N"];
const upperTexts = texts.map(x => x.toUpperCase());

class NullNode {
    constructor() {
        this.init();
    }

    init() {
        this.text = "";
        this.index = 0;
        this.isMatched = false;
        this.matched = texts.map((_, i) => i);
    }

    is(firstChr) {
        return chars.includes(firstChr);
    }

    addChar(chr) {
        if (this.isMatched) {
            if (EMPTYCHARS.has(chr)) {
                return;
            }
            return true;
        }

        const matched = [];
        for(const mi of this.matched) {
            if(this.index < texts[mi].length) {
                if(texts[mi][this.index] === chr || upperTexts[mi][this.index] === chr) {
                    if(this.index === texts[mi].length - 1) {
                        this.isMatched = true;
                    }
                    matched.push(mi);
                }
            }
        }
        this.matched = matched;
        if(matched.length) {
            this.text += chr;
            this.index++;
        } else {
            this.isMatched = false;
            return true;
        }
    }

    getText() {
        if (!this.isMatched) {
            return {
                text: `"${this.text}"`,
                value: this.text,
                ptext: `"${this.text}"`,
            };
        }
        return { text, value: null, ptext: text };
    }

    hasValue() {
        return !!this.text;
    }

    isInString() {
        return false;
    }
}

module.exports = NullNode;
