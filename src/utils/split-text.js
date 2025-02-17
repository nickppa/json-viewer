export function splitText(text, searchData, currentItem) {
    if (!searchData || !searchData.length) {
        return [{ text }];
    }
    const result = [];
    let last = null;
    let lastIndex = -1;
    let lastMaxIndex = -1;
    let lastIsCurrent = false;
    for (const item of searchData) {
        const { index, length } = item;
        const maxIndex = index + length;
        if (currentItem === item) {
            if (last && index <= lastMaxIndex) {
                last.text = last.text.substring(0, index - lastIndex);
                last = { text: text.substring(index, maxIndex), isSelect: 2 };
                result.push(last);
            } else {
                if (index > 0) {
                    result.push({
                        text: text.substring(lastMaxIndex, index),
                    });
                }
                last = { text: text.substring(index, maxIndex), isSelect: 2 };
                result.push(last);
            }
            lastIsCurrent = true;
        } else if (last && index <= lastMaxIndex) {
            if (lastIsCurrent) {
                last = {
                    text: text.substring(lastMaxIndex, maxIndex),
                    isSelect: 1,
                };
                result.push(last);
            } else {
                last.text = last.text + text.substring(lastMaxIndex, maxIndex);
            }
            lastIsCurrent = false;
        } else {
            if (index > 0) {
                result.push({
                    text: text.substring(lastMaxIndex, index),
                });
            }
            last = { text: text.substring(index, maxIndex), isSelect: 1 };
            result.push(last);
            lastIsCurrent = false;
        }
        lastMaxIndex = maxIndex;
        lastIndex = index;
    }
    if (lastMaxIndex <= text.length - 1) {
        result.push({ text: text.substring(lastMaxIndex) });
    }
    return result;
}
