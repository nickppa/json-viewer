import { memo, useState, useRef, useEffect, useCallback } from 'react';
import JsonViewer from './json-viewer';
import { selectRange, reactLoaded } from './utils/vscode-api';

function App() {
    const [jsonData, setJsonData] = useState({});
    const [height, setHeight] = useState(300);
    const refViewer = useRef(null);
    const [lastSelect, setLastSelect] = useState({});
    const [state, setState] = useState({});
    const refState = useRef({});
    const [isSync, setIsSync] = useState(true);
    const refNeedLoadData = useRef(false);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        window.addEventListener('message', handleVSCodeMessage);
        handleResize();
        reactLoaded();
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('message', handleVSCodeMessage);
        };
    }, []);

    const handleVSCodeMessage = useCallback(event => {
        const message = event.data;
        if (message.command === 'changeJsonData') {
            handleChangedJsonData(message.jsonData);
        }
        if (message.command === 'jumpToWebViewNode') {
            handleJumpToNode(message.key);
        }
    }, []);

    const handleResize = useCallback(() => {
        setHeight(window.document.body.clientHeight);
    }, []);

    const handleJumpToNode = (key, notSync = false) => {
        if (notSync) {
            setLastSelect({ isText: true });
        } else {
            refViewer.current.selectNode(key);
        }
    };

    const handleChangedJsonData = useCallback(data => {
        setJsonData(data);
        if (refNeedLoadData.current) {
            refNeedLoadData.current = false;
        }
    }, []);

    const handleSelectNode = node => {
        if (isSync) {
            handleChangeState({
                range: { start: node.startPos, end: node.endPos },
            });
            selectRange({
                startPos: { row: node.startPos.row, column: node.startPos.column },
                endPos: { row: node.endPos.row, column: node.endPos.column },
            });
        } else {
            setLastSelect({ node });
        }
    };

    const handleChangeState = data => {
        for (const key of Object.getOwnPropertyNames(data)) {
            if (data[key] !== undefined) {
                refState.current[key] = data[key];
            }
        }
    };

    return (
        <JsonViewer
            ref={refViewer}
            jsonData={jsonData}
            height={height}
            onSelectNode={handleSelectNode}
            onChangeState={handleChangeState}
            state={state}
        />
    );
}

export default App;
