const vscode = acquireVsCodeApi();
const selectRange = node => {
    console.log(node);
    vscode.postMessage({
        command: 'selectRange',
        node,
    });
};

const copyToClipboard = text => {
    vscode.postMessage({
        command: 'copy',
        text,
    });
};

const reactLoaded = () => {
    vscode.postMessage({
        command: 'reactLoaded',
    });
};

const format = () => {
    vscode.postMessage({
        command: 'format',
    });
};

const minifyFormat = () => {
    vscode.postMessage({
        command: 'minifyFormat',
    });
};

const minifyFormatString = () => {
    vscode.postMessage({
        command: 'minifyFormatString',
    });
};

const copyText = () => {
    vscode.postMessage({
        command: 'copyText',
    });
};

export { selectRange, copyToClipboard, reactLoaded, format, minifyFormat, minifyFormatString, copyText };
