import { parseJson } from "./json-util";

describe("test parse Json", () => {
    it("should init ok", () => {
        expect(parseJson()).toBeUndefined();
    });

    test.each`
        id    | text                                                            | expected
        ${1}  | ${[`{a: 123}`]}                                                 | ${{ a: 123 }}
        ${2}  | ${[`{b: 123}`]}                                                 | ${{ b: 123 }}
        ${3}  | ${[`{a: 123, b: 333}`]}                                         | ${{ a: 123, b: 333 }}
        ${4}  | ${[`{a: 123, c: {b: 333}}`]}                                    | ${{ a: 123, c: { b: 333 } }}
        ${5}  | ${[`{a: 123, c: {b: 333}, d: 123}`]}                            | ${{ a: 123, c: { b: 333 }, d: 123 }}
        ${6}  | ${[`{b: '12"3'}`]}                                              | ${{ b: '12"3' }}
        ${7}  | ${[`{b: "12\\"3"}`]}                                            | ${{ b: '12"3' }}
        ${8}  | ${[`{b: [1, 2, 3]}`]}                                           | ${{ b: [1, 2, 3] }}
        ${9}  | ${[`{b: [1, 2, 3, {a: 123}]}`]}                                 | ${{ b: [1, 2, 3, { a: 123 }] }}
        ${10} | ${[`{b: [1, 2, 3, {a: 123}, 4, 5]}`]}                           | ${{ b: [1, 2, 3, { a: 123 }, 4, 5] }}
        ${11} | ${[`{b: [1, 2, 3, {a: [{b:312, c: '123'}]}, 4, 5]}`]}           | ${{ b: [1, 2, 3, { a: [{ b: 312, c: "123" }] }, 4, 5] }}
        ${12} | ${[`{b    : [1, 2, 3, {a : [{b :312, c  : '123'}]}, 4 , 5 ]}`]} | ${{ b: [1, 2, 3, { a: [{ b: 312, c: "123" }] }, 4, 5] }}
        ${13} | ${[`[1]`]}                                                      | ${[1]}
        ${14} | ${[`{b: [1, 2, 3, {a: [{b:312, c: '123'}]}, 4, 5\n]}`]}         | ${{ b: [1, 2, 3, { a: [{ b: 312, c: "123" }] }, 4, 5] }}
        ${15} | ${[`{a:
            123}`]} | ${{ a: 123 }}
        ${16} | ${[`{a
            :123}`]} | ${{ a: 123 }}
        ${17} | ${[`{a://assssasd
            123}`]} | ${{ a: 123 }}
        ${18} | ${[`{a//assssasd
            :123}`]} | ${{ a: 123 }}
        ${19} | ${[`{a: 1/*asddsa*/23}`]}                                       | ${{ a: 123 }}
        ${20} | ${[`{a: 123}/*asddsa`]}                                         | ${{ a: 123 }}
    `(`should pass scenario $id`, ({ text, expected }) => {
        expect(parseJson(text).obj).toEqual(expected);
    });

    // ${4}  | ${[`{a: 123,}`]}                | ${`no value data`}
    // ${5}  | ${[`{a: 123"222"}`]}            | ${`value is not valid`}
    // ${6}  | ${[`{a: "123"222"}`]}           | ${`value is not valid`}
    test.each`
        id    | text                            | expected
        ${1}  | ${[`{a: 123`]}                  | ${`json is not valid`}
        ${2}  | ${[`a: 123`]}                   | ${`no value`}
        ${3}  | ${[`{a: 123}}`]}                | ${`json is not valid`}
        ${7}  | ${[`{a}`]}                      | ${`json is not valid`}
        ${8}  | ${[`{a:222,[]}`]}               | ${`no key`}
        ${9}  | ${[`{a:222,{}}`]}               | ${`no key`}
        ${10} | ${[`{a:222,[1,2,aaa{a:123}]}`]} | ${`no key`}
    `(`should throw pass scenario $id`, ({ text, expected }) => {
        expect(() => parseJson(text)).toThrow(expected);
    });

    describe("test pos1", () => {
        const text = [`{a: 123}`];
        const jsonData = parseJson(text);
        test.each`
            id   | path                              | expected
            ${1} | ${"data[0].startPos"}             | ${{ column: 0, row: 0 }}
            ${2} | ${"data[0].endPos"}               | ${{ column: 8, row: 0 }}
            ${3} | ${"data[0].children[0].startPos"} | ${{ column: 1, row: 0 }}
            ${4} | ${"data[0].children[0].endPos"}   | ${{ column: 7, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test pos2", () => {
        const text = [`{a: 123 }`];
        const jsonData = parseJson(text);
        test.each`
            id   | path                              | expected
            ${1} | ${"data[0].startPos"}             | ${{ column: 0, row: 0 }}
            ${2} | ${"data[0].endPos"}               | ${{ column: 9, row: 0 }}
            ${3} | ${"data[0].children[0].startPos"} | ${{ column: 1, row: 0 }}
            ${4} | ${"data[0].children[0].endPos"}   | ${{ column: 7, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test pos3", () => {
        const text = [`{ a: 123 }`];
        const jsonData = parseJson(text);
        test.each`
            id   | path                              | expected
            ${1} | ${"data[0].startPos"}             | ${{ column: 0, row: 0 }}
            ${2} | ${"data[0].endPos"}               | ${{ column: 10, row: 0 }}
            ${3} | ${"data[0].children[0].startPos"} | ${{ column: 2, row: 0 }}
            ${4} | ${"data[0].children[0].endPos"}   | ${{ column: 8, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test pos4", () => {
        const text = [`{ a: 123 , b : { c : 23 } }`];
        const jsonData = parseJson(text);
        test.each`
            id   | path                                          | expected
            ${1} | ${"data[0].startPos"}                         | ${{ column: 0, row: 0 }}
            ${2} | ${"data[0].endPos"}                           | ${{ column: 27, row: 0 }}
            ${3} | ${"data[0].children[0].startPos"}             | ${{ column: 2, row: 0 }}
            ${4} | ${"data[0].children[0].endPos"}               | ${{ column: 8, row: 0 }}
            ${5} | ${"data[0].children[1].startPos"}             | ${{ column: 11, row: 0 }}
            ${6} | ${"data[0].children[1].endPos"}               | ${{ column: 25, row: 0 }}
            ${7} | ${"data[0].children[1].children[0].startPos"} | ${{ column: 17, row: 0 }}
            ${8} | ${"data[0].children[1].children[0].endPos"}   | ${{ column: 23, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test array pos1", () => {
        const text = [`{ a: 123 , b : [1, 2, 3] }`];
        const jsonData = parseJson(text);
        test.each`
            id    | path                                          | expected
            ${1}  | ${"data[0].startPos"}                         | ${{ column: 0, row: 0 }}
            ${2}  | ${"data[0].endPos"}                           | ${{ column: 26, row: 0 }}
            ${3}  | ${"data[0].children[0].startPos"}             | ${{ column: 2, row: 0 }}
            ${4}  | ${"data[0].children[0].endPos"}               | ${{ column: 8, row: 0 }}
            ${5}  | ${"data[0].children[1].startPos"}             | ${{ column: 11, row: 0 }}
            ${6}  | ${"data[0].children[1].endPos"}               | ${{ column: 24, row: 0 }}
            ${7}  | ${"data[0].children[1].children[0].startPos"} | ${{ column: 16, row: 0 }}
            ${8}  | ${"data[0].children[1].children[0].endPos"}   | ${{ column: 17, row: 0 }}
            ${9}  | ${"data[0].children[1].children[1].startPos"} | ${{ column: 19, row: 0 }}
            ${10} | ${"data[0].children[1].children[1].endPos"}   | ${{ column: 20, row: 0 }}
            ${11} | ${"data[0].children[1].children[2].startPos"} | ${{ column: 22, row: 0 }}
            ${12} | ${"data[0].children[1].children[2].endPos"}   | ${{ column: 23, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test array pos2", () => {
        const text = [`{ a: 123 , b : [1, 2, 3, {c: 123}] }`];
        const jsonData = parseJson(text);
        test.each`
            id    | path                                                      | expected
            ${1}  | ${"data[0].startPos"}                                     | ${{ column: 0, row: 0 }}
            ${2}  | ${"data[0].endPos"}                                       | ${{ column: 36, row: 0 }}
            ${3}  | ${"data[0].children[0].startPos"}                         | ${{ column: 2, row: 0 }}
            ${4}  | ${"data[0].children[0].endPos"}                           | ${{ column: 8, row: 0 }}
            ${5}  | ${"data[0].children[1].startPos"}                         | ${{ column: 11, row: 0 }}
            ${6}  | ${"data[0].children[1].endPos"}                           | ${{ column: 34, row: 0 }}
            ${7}  | ${"data[0].children[1].children[0].startPos"}             | ${{ column: 16, row: 0 }}
            ${8}  | ${"data[0].children[1].children[0].endPos"}               | ${{ column: 17, row: 0 }}
            ${9}  | ${"data[0].children[1].children[1].startPos"}             | ${{ column: 19, row: 0 }}
            ${10} | ${"data[0].children[1].children[1].endPos"}               | ${{ column: 20, row: 0 }}
            ${11} | ${"data[0].children[1].children[2].startPos"}             | ${{ column: 22, row: 0 }}
            ${12} | ${"data[0].children[1].children[2].endPos"}               | ${{ column: 23, row: 0 }}
            ${13} | ${"data[0].children[1].children[3].startPos"}             | ${{ column: 25, row: 0 }}
            ${14} | ${"data[0].children[1].children[3].endPos"}               | ${{ column: 33, row: 0 }}
            ${15} | ${"data[0].children[1].children[3].children[0].startPos"} | ${{ column: 26, row: 0 }}
            ${16} | ${"data[0].children[1].children[3].children[0].endPos"}   | ${{ column: 32, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test array pos3", () => {
        const text = [`{ a: 123 , b : [1, 2, 3, [321123]] }`];
        const jsonData = parseJson(text);
        test.each`
            id    | path                                                      | expected
            ${1}  | ${"data[0].startPos"}                                     | ${{ column: 0, row: 0 }}
            ${2}  | ${"data[0].endPos"}                                       | ${{ column: 36, row: 0 }}
            ${3}  | ${"data[0].children[0].startPos"}                         | ${{ column: 2, row: 0 }}
            ${4}  | ${"data[0].children[0].endPos"}                           | ${{ column: 8, row: 0 }}
            ${5}  | ${"data[0].children[1].startPos"}                         | ${{ column: 11, row: 0 }}
            ${6}  | ${"data[0].children[1].endPos"}                           | ${{ column: 34, row: 0 }}
            ${7}  | ${"data[0].children[1].children[0].startPos"}             | ${{ column: 16, row: 0 }}
            ${8}  | ${"data[0].children[1].children[0].endPos"}               | ${{ column: 17, row: 0 }}
            ${9}  | ${"data[0].children[1].children[1].startPos"}             | ${{ column: 19, row: 0 }}
            ${10} | ${"data[0].children[1].children[1].endPos"}               | ${{ column: 20, row: 0 }}
            ${11} | ${"data[0].children[1].children[2].startPos"}             | ${{ column: 22, row: 0 }}
            ${12} | ${"data[0].children[1].children[2].endPos"}               | ${{ column: 23, row: 0 }}
            ${13} | ${"data[0].children[1].children[3].startPos"}             | ${{ column: 25, row: 0 }}
            ${14} | ${"data[0].children[1].children[3].endPos"}               | ${{ column: 33, row: 0 }}
            ${15} | ${"data[0].children[1].children[3].children[0].startPos"} | ${{ column: 26, row: 0 }}
            ${16} | ${"data[0].children[1].children[3].children[0].endPos"}   | ${{ column: 32, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    describe("test array pos4", () => {
        const text = [`{ a: 123 , b : [1, 2, 3, [{a:12}]] }`];
        const jsonData = parseJson(text);
        test.each`
            id    | path                                                                  | expected
            ${1}  | ${"data[0].startPos"}                                                 | ${{ column: 0, row: 0 }}
            ${2}  | ${"data[0].endPos"}                                                   | ${{ column: 36, row: 0 }}
            ${3}  | ${"data[0].children[0].startPos"}                                     | ${{ column: 2, row: 0 }}
            ${4}  | ${"data[0].children[0].endPos"}                                       | ${{ column: 8, row: 0 }}
            ${5}  | ${"data[0].children[1].startPos"}                                     | ${{ column: 11, row: 0 }}
            ${6}  | ${"data[0].children[1].endPos"}                                       | ${{ column: 34, row: 0 }}
            ${7}  | ${"data[0].children[1].children[0].startPos"}                         | ${{ column: 16, row: 0 }}
            ${8}  | ${"data[0].children[1].children[0].endPos"}                           | ${{ column: 17, row: 0 }}
            ${9}  | ${"data[0].children[1].children[1].startPos"}                         | ${{ column: 19, row: 0 }}
            ${10} | ${"data[0].children[1].children[1].endPos"}                           | ${{ column: 20, row: 0 }}
            ${11} | ${"data[0].children[1].children[2].startPos"}                         | ${{ column: 22, row: 0 }}
            ${12} | ${"data[0].children[1].children[2].endPos"}                           | ${{ column: 23, row: 0 }}
            ${13} | ${"data[0].children[1].children[3].startPos"}                         | ${{ column: 25, row: 0 }}
            ${14} | ${"data[0].children[1].children[3].endPos"}                           | ${{ column: 33, row: 0 }}
            ${15} | ${"data[0].children[1].children[3].children[0].startPos"}             | ${{ column: 26, row: 0 }}
            ${16} | ${"data[0].children[1].children[3].children[0].endPos"}               | ${{ column: 32, row: 0 }}
            ${17} | ${"data[0].children[1].children[3].children[0].children[0].startPos"} | ${{ column: 27, row: 0 }}
            ${18} | ${"data[0].children[1].children[3].children[0].children[0].endPos"}   | ${{ column: 31, row: 0 }}
        `(`should get right pos pass scenario $id`, ({ path, expected }) => {
            expect(eval(`(jsonData.${path})`)).toEqual(expected);
        });
    });

    test.each`
        id    | text                                                                      | expected
        ${1}  | ${[`/*test*/{a: 123}`]}                                                   | ${[{ path: `data[0].beforeComments[0]`, value: "test" }]}
        ${2}  | ${[`/*test1*//*test2*/{a: 123}`]}                                         | ${[{ path: `data[0].beforeComments[0]`, value: "test1" }, { path: `data[0].beforeComments[1]`, value: "test2" }]}
        ${3}  | ${[`{a: 123}/*test*/`]}                                                   | ${[{ path: `data[0].afterComments[0]`, value: "test" }]}
        ${4}  | ${[`{/*test*/a: 123}`]}                                                   | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test" }]}
        ${5}  | ${[`{/*test1*/a: 123/*test2*/}`]}                                         | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[0].afterComments[0]`, value: "test2" }]}
        ${6}  | ${[`{/*test1*/a: 12/*test2*/3}`]}                                         | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[0].afterComments[0]`, value: "test2" }]}
        ${7}  | ${[`{/*test1*/a: 123, /*test2*/b: 222}`]}                                 | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[1].beforeComments[0]`, value: "test2" }]}
        ${8}  | ${[`{/*test1*/a: 123, c: /*test2*/{b: 222}}`]}                            | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[1].beforeComments[0]`, value: "test2" }]}
        ${9}  | ${[`{/*test1*/a: 123, c: /*test2*/{/*test3*/b: 222}}`]}                   | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[1].beforeComments[0]`, value: "test2" }, { path: `data[0].children[1].children[0].beforeComments[0]`, value: "test3" }]}
        ${10} | ${[`/*test*/[1, 2, 3]`]}                                                  | ${[{ path: `data[0].beforeComments[0]`, value: "test" }]}
        ${11} | ${[`/*test1*/[/*test2*/1/*test3*/, 2, 3]`]}                               | ${[{ path: `data[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[0].beforeComments[0]`, value: "test2" }, { path: `data[0].children[0].afterComments[0]`, value: "test3" }]}
        ${12} | ${[`{/*test1*/a: 123, /*test2*/c: {/*test3*/b: 222}}`]}                   | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[1].beforeComments[0]`, value: "test2" }, { path: `data[0].children[1].children[0].beforeComments[0]`, value: "test3" }]}
        ${13} | ${[`{/*test1*/a: 123, /*test21*/c: /*test22*/{/*test3*/b: 222}}`]}        | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[1].beforeComments[0]`, value: "test21" }, { path: `data[0].children[1].beforeComments[1]`, value: "test22" }, { path: `data[0].children[1].children[0].beforeComments[0]`, value: "test3" }]}
        ${14} | ${[`{/*test1*/a: 123, /*test21*/c: /*test22*/{/*test3*/b: 222}/*123*/}`]} | ${[{ path: `data[0].children[0].beforeComments[0]`, value: "test1" }, { path: `data[0].children[1].beforeComments[0]`, value: "test21" }, { path: `data[0].children[1].beforeComments[1]`, value: "test22" }, { path: `data[0].children[1].afterComments[0]`, value: "123" }, { path: `data[0].children[1].children[0].beforeComments[0]`, value: "test3" }]}
    `(`should pass comments scenario $id`, ({ text, expected }) => {
        const data = parseJson(text).data;
        for (const ept of expected) {
            expect(eval(`(${ept.path})`)).toEqual(ept.value);
        } 
    });
});
