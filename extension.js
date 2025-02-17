// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path = require('path');
const vscode = require('vscode');
const debounce = require('lodash.debounce');
const { parseJson, format } = require('./utils/json-util');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // if(!vscode.window.activeTextEditor) {
    //     console.log('No active text editor!');
    //     return;
    // }
    console.log('Congratulations, your extension "json-viewer" is now active!');

    const onChangeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (ReactPanel.currentPanel._editor.document === event.document) {
            ReactPanel.currentPanel.textChanged();
        }
    });

    const onChangeSelectionDisposable = vscode.window.onDidChangeTextEditorSelection(event => {
        const editor = event.textEditor;
        if (ReactPanel.currentPanel._editor === editor) {
            ReactPanel.currentPanel.jumpToNode(editor.selection);
        }
    });

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('json-viewer.jsonViewer', function () {
        // The code you place here will be executed every time your command is executed
        if (vscode.window.activeTextEditor) {
            ReactPanel.createOrShow(context.extensionPath, vscode.window.activeTextEditor);
            // // Display a message box to the user
            // vscode.window.showInformationMessage('Hello VS Code');
        }
    });

    context.subscriptions.push(onChangeDisposable, onChangeSelectionDisposable, disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

const EMPTYOBJ = {};
const EMPTYARR = [];

class ReactPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    static currentPanel;

    static viewType = 'react';

    _panel;
    _extensionPath;
    _disposables = [];
    _reactLoaded = false;
    _editor = null;

    refRangeChanged = null;
    refIsValid = false;
    jsonDataRef = EMPTYOBJ;

    static createOrShow(extensionPath, editor) {
        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (ReactPanel.currentPanel) {
            ReactPanel.currentPanel._panel.reveal();
        } else {
            ReactPanel.currentPanel = new ReactPanel(extensionPath, editor);
        }
    }

    changeJsonData = jsonData => {
        this._panel.webview.postMessage({ command: 'changeJsonData', jsonData });
    };

    jumpToWebViewNode = key => {
        this._panel.webview.postMessage({ command: 'jumpToWebViewNode', key });
    };

    findObj = (array, { column, row }) => {
        let left = 0,
            right = array.length - 1;
        let mid = Math.ceil((left + right) / 2);
        while (left <= mid && right >= mid) {
            const { startPos, endPos, children } = array[mid];
            if (row > startPos.row || (row === startPos.row && column >= startPos.column)) {
                if (
                    row < endPos.row ||
                    (row === endPos.row && column <= endPos.column) ||
                    (mid < array.length - 1 &&
                        (row < array[mid + 1].startPos.row || (row === array[mid + 1].startPos.row && column <= array[mid + 1].startPos.column)))
                ) {
                    if (children && children.length) {
                        const res = this.findObj(children, { column, row });
                        if (res) {
                            return res;
                        }
                    }
                    return array[mid];
                }
                left = mid + 1;
                mid = Math.ceil((left + right) / 2);
            } else {
                right = mid - 1;
                mid = Math.ceil((left + right) / 2);
            }
        }
        return null;
    };

    splitKey = key => {
        const result = [];
        let temp = '';
        for (let i = 0; i < key.length; i++) {
            if (key[i] === '[' || key[i] === '.') {
                result.push(temp);
                temp = '' + key[i];
            } else {
                temp += key[i];
            }
        }
        result.push(temp);
        return result;
    };

    jump = (startKey, endKey) => {
        const starts = this.splitKey(startKey);
        const ends = this.splitKey(endKey);
        const keys = [];
        const minLength = Math.min(starts.length, ends.length);
        for (let i = 0; i < minLength; i++) {
            if (starts[i] === ends[i]) {
                keys.push(starts[i]);
            } else {
                break;
            }
        }
        this.jumpToWebViewNode(keys.join(''));
        return;
    };

    jumpToNode = selection => {
        if (!this.jsonDataRef.data) {
            return;
        }
        const range = {
            start: { row: selection.start.line, column: selection.start.character },
            end: { row: selection.end.line, column: selection.end.character },
        };
        const startObj = this.findObj(this.jsonDataRef.data, range.start);
        const endObj = this.findObj(this.jsonDataRef.data, range.end);
        if (!startObj && !endObj) {
            return;
        }
        if (!startObj && endObj) {
            this.jumpToWebViewNode(endObj.key);
            return;
        }
        if (startObj && !endObj) {
            this.jumpToWebViewNode(startObj.key);
            return;
        }
        if (startObj === endObj) {
            this.jumpToWebViewNode(startObj.key);
            return;
        }
        this.jump(startObj.key, endObj.key);
    };

    selectRange = ({ startPos, endPos }) => {
        const editor = this._editor;
        const sPos = new vscode.Position(startPos.row, startPos.column);
        const ePos = new vscode.Position(endPos.row, endPos.column);
        const selection = new vscode.Selection(sPos, ePos);

        editor.selection = selection;
        editor.revealRange(new vscode.Range(sPos, ePos), vscode.TextEditorRevealType.AtTop);
    };

    handleFormat = () => {
        if (!this.refIsValid) return;
        const text = format(this.jsonDataRef.data[0], true).trim();
        const fullRange = new vscode.Range(
            this._editor.document.positionAt(0),
            this._editor.document.positionAt(this._editor.document.getText().length)
        );
        this._editor.edit(editBuilder => {
            editBuilder.replace(fullRange, text);
        });
    };

    handleMinifyFormat = () => {
        if (!this.refIsValid) return;
        const text = JSON.stringify(this.jsonDataRef.obj);
        vscode.env.clipboard.writeText(text).then(() => {
            vscode.window.showInformationMessage('Copied!');
        });
    };

    handleMinifyFormatString = () => {
        if (!this.refIsValid) return;
        const text = JSON.stringify(JSON.stringify(this.jsonDataRef.obj));
        vscode.env.clipboard.writeText(text).then(() => {
            vscode.window.showInformationMessage('Copied!');
        });
    };

    handleCopyText = () => {
        vscode.env.clipboard.writeText(this._editor.document.getText()).then(() => {
            vscode.window.showInformationMessage('Copied!');
        });
    };

    constructor(extensionPath, editor) {
        this._extensionPath = extensionPath;
        this._editor = editor;

        // Create and show a new webview panel
        this._panel = vscode.window.createWebviewPanel(ReactPanel.viewType, 'json-viewer', vscode.ViewColumn.Beside, {
            // Enable javascript in the webview
            enableScripts: true,

            // And restric the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionPath, 'build'))],
        });

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'copy':
                        vscode.env.clipboard.writeText(message.text).then(() => {
                            vscode.window.showInformationMessage('Copied!');
                        });
                        return;
                    case 'selectRange':
                        this.selectRange(message.node);
                        //
                        return;
                    case 'reactLoaded':
                        this._reactLoaded = true;
                        this.textChanged();
                        return;
                    case 'format':
                        this.handleFormat();
                        return;
                    case 'minifyFormat':
                        this.handleMinifyFormat();
                        return;
                    case 'minifyFormatString':
                        this.handleMinifyFormatString();
                        return;
                    case 'copyText':
                        this.handleCopyText();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    setAnnotations = arr => {};

    textChanged = () => {
        this.processJson(this._editor.document.getText());
    };

    convertToJson = () => {
        try {
            const editor = this._editor;
            const document = editor.document;
            const lines = [];
            for (let i = 0; i < document.lineCount; i++) {
                lines.push(document.lineAt(i).text);
            }
            const result = parseJson(lines);
            this.setAnnotations(EMPTYARR);
            return result;
        } catch (err) {
            const annotations =
                err.row !== undefined
                    ? [
                          {
                              row: err.row,
                              column: err.column,
                              text: err.message,
                              type: 'error',
                          },
                      ]
                    : EMPTYARR;
            this.setAnnotations(EMPTYARR);
            vscode.window.showErrorMessage('Error in text');
            setTimeout(() => this.setAnnotations(annotations));
            return undefined;
        }
    };

    processJson = debounce(text => {
        if (!this._reactLoaded) return;
        const jsonData = this.convertToJson();
        if (this.refRangeChanged) {
            this.selectRange(this.refRangeChanged);
            this.refRangeChanged = null;
        }
        this.refIsValid = false;
        if (jsonData) {
            this.refIsValid = true;
            this.jsonDataRef = jsonData;
            this.changeJsonData(jsonData);
        } else if (!text) {
            this.refIsValid = true;
            this.jsonDataRef = EMPTYOBJ;
            this.changeJsonData(EMPTYOBJ);
        }
    }, 300);

    dispose() {
        ReactPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    _getHtmlForWebview(webview) {
        const manifest = require(path.join(this._extensionPath, 'build', 'asset-manifest.json'));
        const mainScript = manifest['files']['main.js'];
        const mainStyle = manifest['files']['main.css'];

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionPath, 'build', mainScript)));
        const cssUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionPath, 'build', mainStyle)));

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>json-viewer</title>
				<link rel="stylesheet" type="text/css" href="${cssUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'self' vscode-resource:; style-src 'self' vscode-resource: 'unsafe-inline';">
				<!--<meta http-equiv="Content-Security-Policy" content="default-src 'self' vscode-resource:; style-src 'self' vscode-resource: 'unsafe-inline';">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;"> !-->
				<base href="${vscode.Uri.file(path.join(this._extensionPath, 'build')).with({ scheme: 'vscode-resource' })}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

module.exports = {
    activate,
    deactivate,
};
