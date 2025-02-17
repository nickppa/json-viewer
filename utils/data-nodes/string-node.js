const { EMPTYCHARS } = require('./EMPTYCHARS');
const SpecialChar = {
    b: '\b',
    t: '\t',
    n: '\n',
    v: '\v',
    f: '\f',
    r: '\r',
};
const SpecialChars = Object.keys(SpecialChar).join('');
const UnSpecialChar = {
    '"': '\\"',
    "'": "\\'",
    '\\': '\\\\',
};
const UnSpecialChars = Object.keys(UnSpecialChar).join('');

exports.SpecialChar = SpecialChar;
exports.SpecialChars = SpecialChars;
exports.UnSpecialChar = UnSpecialChar;
exports.UnSpecialChars = UnSpecialChars;

class StringNode {
    constructor() {
        this.init();
    }

    init(text = '') {
        if (text) {
            this.addStringWrap = true;
        } else {
            this.addStringWrap = false;
        }
        this.isSlash = false;
        this.isEnd = false;
        this.text = text;
        this.textValue = text;
        this.pa = '';
    }

    is(firstChr) {
        return true;
    }

    addChar(chr) {
        if (this.isEnd) {
            return;
        }
        if (!this.text && !this.pa) {
            if (chr === '"' || chr === "'") {
                this.pa = chr;
                this.addStringWrap = false;
                return;
            }
            this.addStringWrap = true;
        }
        if ((chr === '\\') & !this.isSlash) {
            this.isSlash = true;
            return;
        } else if (this.isSlash) {
            this.isSlash = false;
            if (SpecialChars.includes(chr)) {
                this.text += '\\' + chr;
                this.textValue += SpecialChar[chr];
            } else if (UnSpecialChars.includes(chr)) {
                this.text += UnSpecialChar[chr];
                this.textValue += chr;
            } else {
                this.text += chr;
                this.textValue += chr;
            }
            return;
        }
        if (!this.addStringWrap && chr === this.pa) {
            this.isEnd = true;
            return;
        }
        if (this.addStringWrap && EMPTYCHARS.has(chr)) {
            this.isEnd = true;
            return;
        }
        this.text += chr;
        this.textValue += chr;
    }

    getText() {
        const text = `"${this.text}"`;
        return { text, value: this.textValue, ptext: `"${this.textValue}"` };
    }

    getString() {
        return this.textValue;
    }

    hasValue() {
        return true;
    }

    isInString() {
        return !!this.pa && !this.isEnd;
    }
}

module.exports = StringNode;
