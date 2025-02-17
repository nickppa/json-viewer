import { splitText } from "./split-text";

describe("test split text", () => {
    it("should init ok", () => {
        expect(splitText("aaaa")).toEqual([{ text: "aaaa" }]);
    });

    describe("test split text", () => {
        const text = `abcdefghijklmn`;
        test.each`
            id   | searchData                                            | expected
            ${1} | ${[{ index: 0, length: 3 }]}                          | ${[{ text: "abc", isSelect: 1 }, { text: "defghijklmn" }]}
            ${2} | ${[{ index: 0, length: 14 }]}                         | ${[{ text: "abcdefghijklmn", isSelect: 1 }]}
            ${3} | ${[{ index: 0, length: 3 }, { index: 1, length: 3 }]} | ${[{ text: "abcd", isSelect: 1 }, { text: "efghijklmn" }]}
            ${4} | ${[{ index: 0, length: 3 }, { index: 4, length: 3 }]} | ${[{ text: "abc", isSelect: 1 }, { text: "d" }, { text: "efg", isSelect: 1 }, { text: "hijklmn" }]}
        `(`should pass scenario $id`, ({ searchData, expected }) => {
            expect(splitText(text, searchData)).toEqual(expected);
        });
    });

    it("should pass scenario 5", () => {
        const text = `abcdefghijklmn`;
        const currentItem = { index: 0, length: 3 };
        const searchData = [currentItem];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: "abc", isSelect: 2 },
            { text: "defghijklmn" },
        ]);
    });

    it("should pass scenario 6", () => {
        const text = `abcdefghijklmn`;
        const currentItem = { index: 1, length: 3 };
        const searchData = [currentItem];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: "a" },
            { text: "bcd", isSelect: 2 },
            { text: "efghijklmn" },
        ]);
    });

    it("should pass scenario 7", () => {
        const text = `abcdefghijklmn`;
        const currentItem = { index: 1, length: 3 };
        const searchData = [{ index: 0, length: 3 }, currentItem];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: "a", isSelect: 1 },
            { text: "bcd", isSelect: 2 },
            { text: "efghijklmn" },
        ]);
    });

    it("should pass scenario 8", () => {
        const text = `abcdefghijklmn`;
        const currentItem = { index: 1, length: 3 };
        const searchData = [
            { index: 0, length: 3 },
            currentItem,
            { index: 2, length: 3 },
        ];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: "a", isSelect: 1 },
            { text: "bcd", isSelect: 2 },
            { text: "e", isSelect: 1 },
            { text: "fghijklmn" },
        ]);
    });

    it("should pass scenario 9", () => {
        const text = `abcdefghijklmn`;
        const currentItem = { index: 1, length: 3 };
        const searchData = [
            { index: 0, length: 3 },
            currentItem,
            { index: 4, length: 3 },
        ];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: "a", isSelect: 1 },
            { text: "bcd", isSelect: 2 },
            { text: "efg", isSelect: 1 },
            { text: "hijklmn" },
        ]);
    });

    it("should pass scenario 10", () => {
        const text = `code: "OrgId"`;
        const currentItem = { index: 7, length: 5 };
        const searchData = [currentItem];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: 'code: "' },
            { text: "OrgId", isSelect: 2 },
            { text: '"' },
        ]);
    });

    it("should pass scenario 11", () => {
        const text = `code: "OrgId"`;
        const currentItem = { index: 7, length: 6 };
        const searchData = [currentItem];
        expect(splitText(text, searchData, currentItem)).toEqual([
            { text: 'code: "' },
            { text: 'OrgId"', isSelect: 2 },
        ]);
    });
});
