const EMPTYCHARS = Array.prototype.reduce.call(
    " \f\n\r\t\v",
    (p, c) => {
        p.add(c);
        return p;
    },
    new Set()
);
exports.EMPTYCHARS = EMPTYCHARS;
