const DataNode = require('./data-nodes');
const { SpecialChar, UnSpecialChar } = require('./data-nodes/string-node');

const UnSpecialChars = [];
for (const key in UnSpecialChar) {
    UnSpecialChars.push({reg: new RegExp(escapeRegex(key), 'g'), value: UnSpecialChar[key]});
}
const SpecialChars = [];
for (const key in SpecialChar) {
    SpecialChars.push({reg: new RegExp(escapeRegex(SpecialChar[key]), 'g'), value: '\\' + key});
}

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}"]/g, "\\$&");
}

const SPLITCHAR = ':';
const PAIREDCHARS = ['{}', '[]']
    .flatMap(x => [
        { key: x[0], pair: x[1], plus: 1 },
        { key: x[1], pair: x[0], plus: -1 },
    ])
    .reduce((p, c) => {
        p.set(c.key, c);
        return p;
    }, new Map());

const EMPTYCHARS = Array.prototype.reduce.call(
    ' \f\n\r\t\v',
    (p, c) => {
        p.add(c);
        return p;
    },
    new Set()
);

function setObjValue(currentObj, key, value, startPos) {
    const isArray = Array.isArray(currentObj);
    if (isArray) {
        currentObj.push(value);
    } else {
        if (!key) {
            throw new JsonException({ message: 'no key', ...startPos });
        }
        if (currentObj.hasOwnProperty(key)) {
            throw new JsonException({
                message: 'duplicate key:' + key,
                ...startPos,
            });
        }
        currentObj[key] = value;
    }
    return isArray;
}

function getKeyAndTitle(isArray, currentObj, pre, key) {
    if (isArray) {
        const index = currentObj.length - 1;
        const jkey = `${pre}[${index}]`;
        const title = `${index}`;
        return { title, jkey };
    } else {
        const jkey = `${pre}.${key}`;
        const title = key;
        return { title, jkey };
    }
}

function addColumnIndex(lines, columnIndex, rowIndex) {
    columnIndex++;
    if (columnIndex > lines[rowIndex].length) {
        rowIndex++;
        columnIndex = 0;
    }
    return { column: columnIndex, row: rowIndex };
}

class JsonException {
    constructor({ message, data, column, row }) {
        this.message = message;
        this.column = column;
        this.row = row;
        this.data = data;
    }
}

exports.parseJson = (lines) => {
    if (!lines || !lines.length) return undefined;
    const text = lines.join('\n');
    if (!text) return undefined;
    DataNode.init();

    let result = null;

    let pairStatus = 0;

    let key = '';
    DataNode.changeMode('v');

    let currentObj = null;
    const stack = [];

    let rowIndex = 0;
    let columnIndex = 0;

    const title = 'JSON';
    const jkey = 'JSON';
    let pre = 'JSON';
    const stackPre = [];
    const textsData = [];
    const keysData = [];
    const lastLevelKeys = new Set();
    textsData.push(title);
    keysData.push(jkey);
    let startPos = { column: 0, row: 0 };
    let endPos = { column: 0, row: 0 };
    const rootData = {
        title,
        key: jkey,
        children: [],
        // isObj: !isArray,
        // isArray,
        startPos,
        name: '',
    };
    let currentData = rootData;
    const stackCurrentData = [];
    const jsonData = {
        data: [rootData],
        texts: textsData,
        keys: keysData,
        lastLevelKeys,
    };
    let comments = [];
    let beforeComments = [];
    let isLineCommentStarted = false;
    let lineComment = '';
    let isBlockCommentStarted = false;
    let blockComment = '';
    let lastData = null;

    const plusColumnIndex = () => {
        columnIndex++;
        if (columnIndex > lines[rowIndex].length) {
            rowIndex++;
            columnIndex = 0;
        }
    };

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (isBlockCommentStarted) {
            if (c === '*' && ((i < text.length - 1 && text[i + 1] === '/') || i === text.length - 1)) {
                isBlockCommentStarted = false;
                i++;
                plusColumnIndex();
                if (blockComment) {
                    comments.push(blockComment);
                }
            } else {
                if (!blockComment && (c === ' ' || c === '\t' || c === '\v')) {
                } else {
                    blockComment += c;
                }
            }
            plusColumnIndex();
            continue;
        }
        if (isLineCommentStarted) {
            if (c === '\r' || c === '\n') {
                isLineCommentStarted = false;
                if (lineComment) {
                    comments.push(lineComment);
                }
            } else {
                if (!lineComment && (c === ' ' || c === '\t' || c === '\v')) {
                } else {
                    lineComment += c;
                }
            }
            plusColumnIndex();
            continue;
        }
        if (!DataNode.isInString() && c === '/' && i < text.length - 1) {
            const nextChr = text[i + 1];
            if (nextChr === '*') {
                isBlockCommentStarted = true;
                i++;
                plusColumnIndex();
                plusColumnIndex();
                blockComment = '';
                continue;
            } else if (nextChr === '/') {
                isLineCommentStarted = true;
                i++;
                plusColumnIndex();
                plusColumnIndex();
                lineComment = '';
                continue;
            }
        }

        if (!DataNode.isInString() && c === SPLITCHAR) {
            if (DataNode.mode !== 'k') {
                throw new JsonException({ message: 'no value', ...startPos });
            }
            if (!currentObj) {
                throw new JsonException({ message: 'no json', ...startPos });
            }
            key = DataNode.getText().value;
            DataNode.changeMode('v');
        } else if (!DataNode.isInString() && c === '{') {
            if (DataNode.hasValue()) {
                throw new JsonException({
                    message: 'json is not valid',
                    ...startPos,
                });
            }
            // obj start
            if (result === null) {
                result = {};
                currentObj = result;
                DataNode.changeMode('k');

                rootData.isObj = true;
                rootData.isArray = false;
                rootData.obj = currentObj;
            } else {
                const a = {};
                stack.push(currentObj);
                DataNode.changeMode('k');
                const isArray = setObjValue(currentObj, key, a, startPos);

                if (isArray) {
                    startPos = { column: columnIndex, row: rowIndex };
                }
                const { title, jkey } = getKeyAndTitle(isArray, currentObj, pre, key);
                textsData.push(title);
                keysData.push(jkey);
                const b = {
                    title,
                    key: jkey,
                    children: [],
                    isObj: true,
                    isArray: false,
                    startPos,
                    obj: a,
                    name: isArray ? '' : key,
                };
                currentData.children.push(b);
                stackPre.push(pre);
                pre = jkey;
                stackCurrentData.push(currentData);
                currentData = b;

                key = '';
                currentObj = a;
            }
            if (beforeComments.length) {
                currentData.beforeComments = beforeComments;
                beforeComments = [];
            }
            if (comments.length) {
                if (currentData.beforeComments) currentData.beforeComments.push(...comments);
                else currentData.beforeComments = comments;
                comments = [];
            }
            pairStatus += PAIREDCHARS.get(c).plus;
        } else if (!DataNode.isInString() && c === '[') {
            if (DataNode.hasValue()) {
                throw new JsonException({
                    message: 'json is not valid',
                    ...startPos,
                });
            }
            // obj start
            if (result === null) {
                result = [];
                currentObj = result;
                DataNode.changeMode('v');

                rootData.isObj = false;
                rootData.isArray = true;
                rootData.obj = currentObj;
            } else {
                const a = [];
                stack.push(currentObj);
                DataNode.changeMode('v');
                const isArray = setObjValue(currentObj, key, a, startPos);

                if (isArray) {
                    startPos = { column: columnIndex, row: rowIndex };
                }
                const { title, jkey } = getKeyAndTitle(isArray, currentObj, pre, key);
                textsData.push(title);
                keysData.push(jkey);
                const b = {
                    title,
                    key: jkey,
                    children: [],
                    isObj: false,
                    isArray: true,
                    startPos,
                    obj: a,
                    name: isArray ? '' : key,
                };
                currentData.children.push(b);
                stackPre.push(pre);
                pre = jkey;
                stackCurrentData.push(currentData);
                currentData = b;

                key = '';
                currentObj = a;
            }

            if (beforeComments.length) {
                currentData.beforeComments = beforeComments;
                beforeComments = [];
            }
            if (comments.length) {
                if (currentData.beforeComments) currentData.beforeComments.push(...comments);
                else currentData.beforeComments = comments;
                comments = [];
            }
            pairStatus += PAIREDCHARS.get(c).plus;
        } else if (!DataNode.isInString() && (c === '}' || c === ',' || c === ']')) {
            const isArray = Array.isArray(currentObj);
            if (DataNode.hasValue()) {
                if (!isArray && key) {
                    const t = DataNode.getText();
                    const value = t.value;
                    setObjValue(currentObj, key, value, startPos);

                    const text = t.ptext;
                    const jkey = `${pre}.${key}`;
                    lastLevelKeys.add(pre);
                    const title = key + ': ' + text;
                    textsData.push(title);
                    keysData.push(jkey);
                    const myData = {
                        title,
                        key: jkey,
                        startPos,
                        endPos,
                        obj: value,
                        beforeComments,
                        name: key,
                        text: t.text,
                        value: t.value,
                    };
                    currentData.children.push(myData);
                    if (comments.length) {
                        myData.afterComments = comments;
                        comments = [];
                    }
                    beforeComments = [];
                    DataNode.changeMode('k');
                    key = '';
                } else if (isArray) {
                    const t = DataNode.getText();
                    const value = t.value;
                    setObjValue(currentObj, key, value, startPos);

                    const index = currentObj.length - 1;
                    const jkey = `${pre}[${index}]`;
                    const text = t.ptext;
                    lastLevelKeys.add(pre);
                    const title = `${index}: ${text}`;
                    textsData.push(title);
                    keysData.push(jkey);
                    const myData = {
                        title,
                        key: jkey,
                        startPos,
                        endPos,
                        obj: value,
                        beforeComments,
                        text: t.text,
                        value: t.value,
                    };
                    currentData.children.push(myData);
                    if (comments.length) {
                        myData.afterComments = comments;
                        comments = [];
                    }
                    beforeComments = [];
                } else {
                    throw new JsonException({
                        message: 'json is not valid',
                        ...startPos,
                    });
                }
            } else if (key) {
                throw new JsonException({ message: 'no value', ...startPos });
            }
            //  else if (c === "," && (lastSpec === "," || lastSpec === "[" || lastSpec === "{")) {
            //     throw new JsonException({ message: "no value data", ...startPos });
            // } else if (lastSpec === "," && (c === "]" || c === "}")) {
            //     throw new JsonException({ message: "no value data", ...startPos });
            // }
            if (c === '}' || c === ']') {
                if (lastData && comments.length) {
                    lastData.afterComments = comments;
                    comments = [];
                }
                lastData = currentData;
                currentObj = stack.pop();
                pre = stackPre.pop();
                if (currentData) {
                    currentData.endPos = addColumnIndex(lines, columnIndex, rowIndex);
                }
                currentData = stackCurrentData.pop();
                if (currentObj) {
                    DataNode.changeMode(Array.isArray(currentObj) ? 'v' : 'k');
                }
            }
            if (PAIREDCHARS.has(c)) {
                pairStatus += PAIREDCHARS.get(c).plus;
            }
        } else if (DataNode.append(c) && !key) {
            startPos = { column: columnIndex, row: rowIndex };

            if (comments.length) {
                beforeComments = comments;
                comments = [];
            }
        }

        plusColumnIndex();

        if (!EMPTYCHARS.has(c)) {
            endPos = { column: columnIndex, row: rowIndex };
        }
    }
    rootData.endPos = {
        column: lines[lines.length - 1].length,
        row: lines.length - 1,
    };
    if (comments.length) {
        rootData.afterComments = comments;
        comments = [];
    }
    if (DataNode.hasValue()) {
        throw new JsonException({ message: 'json is not valid' });
    }
    if (pairStatus) {
        throw new JsonException({ message: 'json is not valid' });
    }
    jsonData.obj = result;
    jsonData.lastLevelKeys = [...jsonData.lastLevelKeys];
    return jsonData;
}

function replaceText(text) {
    let result = text;
    for (const {reg, value} of UnSpecialChars) {
        result = result.replace(reg, value);
    }
    for (const {reg, value} of SpecialChars) {
        result = result.replace(reg, value);
    }
    return result;
}

function format(data, isEnd = false, level = 0) {
    const tab = ' '.repeat(level * 4);
    let result = '';
    if (data.beforeComments && data.beforeComments.length) {
        for (const comment of data.beforeComments) {
            result += tab + '// ' + comment + '\r\n';
        }
    }
    if (data.afterComments && data.afterComments.length) {
        for (const comment of data.afterComments) {
            result += tab + '// ' + comment + '\r\n';
        }
    }
    if (data.isArray) {
        if (data.name) {
            result += `${tab}"${replaceText(data.name)}": [\r\n`;
        } else {
            result += `${tab}[\r\n`;
        }
        for (let i = 0; i < data.children.length; i++) {
            result += format(data.children[i], i === data.children.length - 1, level + 1);
        }
        result += tab + ']';
    } else if (data.isObj) {
        if (data.name) {
            result += `${tab}"${replaceText(data.name)}": {\r\n`;
        } else {
            result += `${tab}{\r\n`;
        }
        for (let i = 0; i < data.children.length; i++) {
            result += format(data.children[i], i === data.children.length - 1, level + 1);
        }
        result += tab + '}';
    } else {
        if (data.name) {
            result += `${tab}"${replaceText(data.name)}": ${data.text}`;
        } else {
            result += tab + data.text;
        }
    }
    if (!isEnd) {
        result += ',\r\n';
    } else {
        result += '\r\n';
    }
    return result;
}

exports.format = format;
