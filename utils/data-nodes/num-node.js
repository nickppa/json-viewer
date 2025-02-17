const EMPTYCHARS = Array.prototype.reduce.call(
    "_ \f\n\r\t\v",
    (p, c) => {
        p.add(c);
        return p;
    },
    new Set()
);

class NumNode {
    constructor() {
        this.init();
    }

    init() {
        this.text = "";
        this.numText = "";
        this.hasM = false;
        this.hasDecimal = false;
        this.lastSpec = "";
        this.num = 0;
        this.xs = 0;
        this.ws = 10;
    }

    is(firstChr) {
        return (
            (firstChr >= "0" && firstChr <= "9") ||
            firstChr === "-" ||
            firstChr === "."
        );
    }

    addChar(chr) {
        if (chr === "-") {
            if (this.numText) {
                return true;
            }
            this.text += chr;
            this.hasM = true;
            return false;
        }
        if (chr === ".") {
            if (this.hasDecimal) {
                return true;
            }
            this.hasDecimal = true;
        }
        if ((chr >= "0" && chr <= "9") || chr === "-" || chr === ".") {
            if (chr >= "0" && chr <= "9") {
                if (this.hasDecimal) {
                    this.xs = this.xs + +chr / this.ws;
                    this.ws = this.ws * 10;
                } else {
                    this.num = this.num * 10 + +chr;
                }
            }
            this.numText += chr;
            this.text += chr;
            this.lastSpec = chr;
        } else if (EMPTYCHARS.has(chr)) {
            this.text += chr;
        } else {
            return true;
        }
    }

    getText() {
        if (this.lastSpec === ".") {
            this.numText = this.numText.substring(0, this.numText.length - 1);
        }
        if (!this.numText) {
            return { text: "0", value: 0, ptext: "0" };
        }
        if (this.numText[0] === ".") {
            this.numText = "0" + this.numText;
        }
        if (this.hasM) {
            this.numText = "-" + this.numText;
            this.num = 0 - this.num;
            this.xs = 0 - this.xs;
        }
        return {
            text: this.numText,
            value: this.num + this.xs,
            ptext: this.numText,
        };
    }

    hasValue() {
        return !!this.text;
    }

    isInString() {
        return false;
    }
}

module.exports = NumNode;
