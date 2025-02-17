const NullNode = require('./null-node');

function isTextOk(nullNode, text) {
    for (const c of text) {
        if (nullNode.addChar(c)) return false;
    }
    return true;
}

describe('test null node', () => {
    it('should init ok', () => {
        const nullNode = new NullNode();
        nullNode.init();
        expect(nullNode.is('n')).toBeTruthy();
    });

    test.each`
        id   | text      | expected
        ${1} | ${'None'} | ${true}
        ${2} | ${'null'} | ${true}
        ${3} | ${'NUll'} | ${true}
        ${4} | ${'NUlL'} | ${true}
        ${5} | ${'NOne'} | ${true}
        ${6} | ${'NOll'} | ${false}
        ${7} | ${'nil'}  | ${true}
        ${8} | ${'nill'} | ${false}
    `(`should pass scenario $id`, ({ text, expected }) => {
        const nullNode = new NullNode();
        nullNode.init();
        expect(isTextOk(nullNode, text)).toEqual(expected);
    });
});
