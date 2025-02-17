const StringNode = require("./string-node");

describe("test parse Json", () => {
    const stringNode = new StringNode();

    test.each`
        id   | text           | expected
        ${1} | ${`"123456"`}  | ${`123456`}
        ${2} | ${`"12\\"3"`}  | ${'12"3'}
        ${3} | ${`"12\\\\3"`} | ${"12\\3"}
        ${4} | ${`12\\\\3`}   | ${"12\\3"}
        ${5} | ${`asddsasd`}  | ${"asddsasd"}
    `(`should pass scenario $id`, ({ text, expected }) => {
        stringNode.init();
        for (let i = 0; i < text.length; i++) {
            stringNode.addChar(text[i]);
        }
        expect(stringNode.getString()).toEqual(expected);
    });
});
