import { memo, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    MinusSquareOutlined,
    PlusSquareOutlined,
    FileTextTwoTone,
    CopyOutlined,
    FileZipOutlined,
    FileTextFilled,
} from '@ant-design/icons';
import { Input, Tooltip, Button, Tree, Space, Dropdown, message } from 'antd';
import useDebounce from '../useDebounce';
import { splitText } from '../utils/split-text';
import { copyToClipboard, format, minifyFormat, minifyFormatString, copyText } from '../utils/vscode-api';
import './json-viewer.scss';

const getIcon = isArray => {
    return isArray ? <span className="ico-array">[]</span> : <span className="ico-object">{'{}'}</span>;
};

const setIcon = array => {
    return array.map(x => {
        const res = { ...x };
        if (x.isArray === true || x.isArray === false) {
            res.icon = getIcon(x.isArray);
        }
        if (res.children) {
            res.children = setIcon(res.children);
        }
        return res;
    });
};

const getNodeKeys = (node, keys = new Set()) => {
    keys.add(node.key);
    if (node.children && node.children.length) {
        for (const item of node.children) {
            getNodeKeys(item, keys);
        }
    }
    return keys;
};

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}"]/g, '\\$&');
}

const menuItems0 = [
    {
        label: 'Copy value',
        key: 'copy-value',
    },
];

const menuItems1 = [
    {
        label: 'Copy value',
        key: 'copy-value',
    },
    {
        label: 'Copy path',
        key: 'copy-path',
    },
];

const menuItems2 = [
    {
        label: 'Copy value',
        key: 'copy-value',
    },
    {
        label: 'Copy path',
        key: 'copy-path',
    },
    {
        label: 'Copy text',
        key: 'copy-text',
    },
];

const JsonViewer = forwardRef(({ jsonData, height, onSelectNode, onChangeState, state }, ref) => {
    const [jsonTree, setJsonTree] = useState([]);
    const [treeHeight, setTreeHeight] = useState(100);
    const refTexts = useRef([]);
    const refKeys = useRef([]);
    const refSearchResult = useRef([]);
    const refLastLevelKeys = useRef([]);
    const treewrapRef = useRef(null);
    const treeRef = useRef(null);
    const refFindIndex = useRef(-1);
    const refIsSearching = useRef(false);
    const refTimeout1 = useRef(null);
    const refStateChanged = useRef(null);
    const refSearchStateChanged = useRef(null);
    const [searchText, setSearchText] = useState('');
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [path, setPath] = useState('');
    const [searchInfo, setSearchInfo] = useState('');
    const [flagWholeWord, setFlagWholeWord] = useState(false);
    const [flagMatchCase, setFlagMatchCase] = useState(false);
    const [flagPattern, setFlagPattern] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        refStateChanged.current = state;
    }, [state]);

    useEffect(() => {
        onChangeState &&
            onChangeState({
                expandedKeys,
                selectedKey: selectedKeys[0],
                searchText,
                flagWholeWord,
                flagMatchCase,
                flagPattern,
                currentSearchIndex,
            });
    }, [expandedKeys, selectedKeys, searchText, flagWholeWord, flagMatchCase, flagPattern, currentSearchIndex]);

    useEffect(() => {
        if (!jsonData.data) {
            setJsonTree([]);
            refFindIndex.current = -1;
            refSearchResult.current = [];
            refIsSearching.current = false;
            setSearchInfo('No results');
            setSearchResults([]);
            setCurrentSearchIndex(-1);
            setPath('');
            return;
        }
        setJsonTree(setIcon(jsonData.data));
        refTexts.current = jsonData.texts;
        refKeys.current = jsonData.keys;
        refLastLevelKeys.current = [...jsonData.lastLevelKeys];
        if (!refStateChanged.current) {
            handleSearch(false);
        }
        setTimeout(() => {
            if (refStateChanged.current) {
                const ss = refStateChanged.current;
                refStateChanged.current = null;
                refSearchStateChanged.current = ss.currentSearchIndex;
                setFlagWholeWord(ss.flagWholeWord);
                setFlagMatchCase(ss.flagMatchCase);
                setFlagPattern(ss.flagPattern);
                if (ss.searchText) {
                    handleChangeSearchText(ss.searchText);
                }
                if (ss.expandedKeys && ss.expandedKeys.length) {
                    setExpandedKeys(ss.expandedKeys);
                } else {
                    if (jsonData.data[0]) {
                        setExpandedKeys([jsonData.data[0].key]);
                    }
                }
                if (ss.selectedKey) {
                    setPath(ss.selectedKey);
                    setSelectedKeys([ss.selectedKey]);
                    if (!(ss.currentSearchIndex >= 0)) {
                        setTimeout(() => {
                            treeRef.current.scrollTo({
                                key: ss.selectedKey,
                                offset: 100,
                            });
                        }, 100);
                    }
                }
            }
        }, 100);
    }, [jsonData]);

    useEffect(() => {
        treewrapRef.current && treewrapRef.current.offsetHeight && setTreeHeight(treewrapRef.current.offsetHeight);
    }, [height]);

    useEffect(() => {
        window.document.addEventListener('keydown', handleKeydown, false);
        return () => {
            window.document.removeEventListener('keydown', handleKeydown, false);
        };
    });

    useImperativeHandle(ref, () => ({
        selectNode,
    }));

    const selectNode = key => {
        selectKey(key, true);
    };

    const handleKeydown = event => {
        if (event.code === 'NumpadEnter' || event.code === 'Enter') {
            if (event.target.localName === 'button') return;
            if (event.shiftKey) {
                handlePrevious();
            } else {
                handleSearchOrNext();
            }
        }
    };

    const handleSearchOrNext = () => {
        if (refIsSearching.current) {
            handleNext();
        } else {
            handleSearch(true);
        }
    };

    const handleCollapseAll = () => {
        setExpandedKeys([]);
    };

    const handleExpandAll = () => {
        setExpandedKeys(refLastLevelKeys.current);
    };

    const handleChangeSearchText = text => {
        refIsSearching.current = false;
        setSearchText(text);
        handleSearch(true);
    };

    const handleSearch = useDebounce(isScroll => {
        search({ flagWholeWord, flagMatchCase, flagPattern }, isScroll);
    }, 300);

    const search = ({ flagWholeWord, flagMatchCase, flagPattern }, isScroll) => {
        if (!searchText) {
            selectKey('', true);
            setSearchInfo('');
            setSearchResults([]);
            setCurrentSearchIndex(-1);
            return;
        }
        refIsSearching.current = true;
        const searchResult = [];
        let pattern = flagPattern ? searchText : escapeRegex(searchText);
        if (flagWholeWord) {
            pattern = '(?<=\\W|^)' + pattern + '(?=\\W|$)';
        }
        const reg = new RegExp(pattern, flagMatchCase ? 'g' : 'gi');
        refTexts.current.forEach((x, i) => {
            if (!x) return;
            const matches = [...x.matchAll(reg)];
            if (!matches.length) return;
            for (const m of matches) {
                searchResult.push({
                    i,
                    index: m.index,
                    length: m[0].length,
                });
            }
        });
        refSearchResult.current = searchResult;
        setSearchResults(searchResult);
        if (searchResult.length > 0) {
            refFindIndex.current = -1;
            if (refSearchStateChanged.current !== null) {
                refFindIndex.current = refSearchStateChanged.current;
                refSearchStateChanged.current = null;
            }
            setSearchedInfo(isScroll);
        } else {
            refFindIndex.current = -1;
            selectKey('', true);
            setSearchInfo('No results');
        }
    };

    const setSearchedInfo = isScroll => {
        if (!refSearchResult.current || !refSearchResult.current.length) return;
        selectCurrentText(isScroll);
        if(refFindIndex.current == undefined) {
            refFindIndex.current = -1;
        }
        setSearchInfo(`${Math.max(0, refFindIndex.current) + 1} of ${refSearchResult.current.length}`);
    };

    const handlePrevious = () => {
        if (refFindIndex.current > 0) {
            refFindIndex.current--;
        } else {
            refFindIndex.current = refSearchResult.current.length - 1;
        }
        setSearchedInfo(true);
    };

    const handleNext = () => {
        if (refFindIndex.current < refSearchResult.current.length - 1) {
            refFindIndex.current++;
        } else {
            refFindIndex.current = 0;
        }
        setSearchedInfo(true);
    };

    const handleExpand = (expandedKeys, { expanded, node }) => {
        let expandedData = null;
        if (expanded) {
            expandedData = [...expandedKeys, node.key];
        } else {
            const keys = getNodeKeys(node);
            expandedData = expandedKeys.filter(x => !keys.has(x));
        }
        setExpandedKeys(expandedData);
    };

    const handleSelect = (selectedKeys, { selected, selectedNodes, node, event }) => {
        if (!node) return;
        selectKey(node.key);
        onSelectNode && onSelectNode(node);
    };

    const selectCurrentText = isScroll => {
        if (refFindIndex.current === -1) {
            return;
        }
        if (!refSearchResult.current[refFindIndex.current]) {
            return;
        }
        const { i } = refSearchResult.current[refFindIndex.current];
        setCurrentSearchIndex(refFindIndex.current);
        setExpandedKeys(expandedKeys => {
            if (expandedKeys.indexOf(refKeys.current[i]) === -1) {
                return [...expandedKeys, refKeys.current[i]];
            }
            return expandedKeys;
        });
        setPath(refKeys.current[i]);
        if (refStateChanged.current) return;
        if (refTimeout1.current) {
            clearTimeout(refTimeout1.current);
        }
        refTimeout1.current = setTimeout(() => {
            if (isScroll) {
                treeRef.current.scrollTo({
                    key: refKeys.current[i],
                    offset: 100,
                });
            }
            refTimeout1.current = null;
        }, 100);
    };

    const selectKey = (key, isScollTo = false) => {
        if (!key) {
            setSelectedKeys([]);
            setPath('');
            return;
        }
        setSelectedKeys([key]);
        setExpandedKeys(expandedKeys => {
            if (expandedKeys.indexOf(key) !== -1) {
                return expandedKeys;
            }
            return [...expandedKeys, key];
        });
        setPath(key);
        if (refStateChanged.current) return;
        if (isScollTo) {
            setTimeout(() => {
                treeRef.current.scrollTo({ key, offset: 100 });
            }, 100);
        }
    };

    const handleCopyPath = () => {
        copyToClipboard(path);
    };

    const handleChangeMatchCase = () => {
        search({ flagWholeWord, flagMatchCase: !flagMatchCase, flagPattern }, true);
        setFlagMatchCase(!flagMatchCase);
    };

    const handleChangeWholeWord = () => {
        search({ flagWholeWord: !flagWholeWord, flagMatchCase, flagPattern }, true);
        setFlagWholeWord(!flagWholeWord);
    };

    const handleChangePattern = () => {
        search({ flagWholeWord, flagMatchCase, flagPattern: !flagPattern }, true);
        setFlagPattern(!flagPattern);
    };

    const handleFormat = () => {
        format();
    };

    const handleMinifyFormat = () => {
        minifyFormat();
    };

    const handleMinifyFormatString = () => {
        minifyFormatString();
    };

    const handleCopyText = () => {
        copyText();
    };

    const onClickMenu = (key, nodeData) => {
        if (key === 'copy-value') {
            if (nodeData.obj === null) {
                copyToClipboard('null');
            } else if (nodeData.obj === undefined) {
                copyToClipboard('undefined');
            } else if (typeof nodeData.obj === 'string' || nodeData.obj instanceof Object) {
                copyToClipboard(JSON.stringify(nodeData.obj, null, '    '));
            } else {
                copyToClipboard(nodeData.obj);
            }
            return;
        }
        if (key === 'copy-path') {
            copyToClipboard(nodeData.key.substring(5));
            return;
        }
        if (key === 'copy-text') {
            copyToClipboard(nodeData.obj);
            return;
        }
    };

    const renderNode = nodeData => {
        const arr = splitText(
            nodeData.title,
            searchResults.filter(x => refKeys.current[x.i] === nodeData.key),
            searchResults[currentSearchIndex]
        );

        const items = nodeData.key === 'JSON' ? menuItems0 : typeof nodeData.obj === 'string' ? menuItems2 : menuItems1;

        return (
            <Dropdown
                menu={{
                    items,
                    onClick: ({ key }) => onClickMenu(key, nodeData),
                }}
                trigger={['contextMenu']}
            >
                <span>
                    {arr.map(({ text, isSelect }, i) => (
                        <span className={isSelect === 1 ? 'in-search' : isSelect === 2 ? 'current-search' : ''} key={i}>
                            {text}
                        </span>
                    ))}
                </span>
            </Dropdown>
        );
    };

    return (
        <div className="json-viewer">
            {contextHolder}
            <div className="tool-bar">
                <Space size={4}>
                    <div className="search-text">
                        <Input value={searchText} onChange={e => handleChangeSearchText(e.target.value)} />
                        <div className="search-info">{searchInfo}</div>
                        <div className="search-toolbar">
                            <div
                                className={flagMatchCase ? 'toolbar-item actived' : 'toolbar-item'}
                                title="Match Case"
                                onClick={handleChangeMatchCase}
                            >
                                Aa
                            </div>
                            <div
                                className={flagWholeWord ? 'toolbar-item actived' : 'toolbar-item'}
                                title="Match Whole Word"
                                onClick={handleChangeWholeWord}
                            >
                                ab
                            </div>
                            <div
                                className={flagPattern ? 'toolbar-item actived' : 'toolbar-item'}
                                title="Use Regular Expression"
                                onClick={handleChangePattern}
                            >
                                .*
                            </div>
                        </div>
                    </div>
                    <Tooltip title="Previous Match(Shift + Enter)">
                        <Button onClick={handlePrevious} icon={<ArrowUpOutlined />} />
                    </Tooltip>
                    <Tooltip title="Next Match(Enter)">
                        <Button onClick={handleNext} icon={<ArrowDownOutlined />} />
                    </Tooltip>
                </Space>
            </div>
            <div className="tool-bar">
                <Space size={4}>
                    <Tooltip title="Collapse All">
                        <Button onClick={handleCollapseAll} icon={<PlusSquareOutlined />} />
                    </Tooltip>
                    <Tooltip title="Expand All">
                        <Button onClick={handleExpandAll} icon={<MinusSquareOutlined />} />
                    </Tooltip>
                    <Tooltip title="Copy Full Path">
                        <Button onClick={handleCopyPath} icon={<CopyOutlined />} />
                    </Tooltip>
                    <Tooltip title="Format">
                        <Button onClick={handleFormat} icon={<FileTextTwoTone />} />
                    </Tooltip>
                    <Tooltip title="Copy Minify JSON">
                        <Button onClick={handleMinifyFormat} icon={<FileZipOutlined />} />
                    </Tooltip>
                    <Tooltip title="Copy Minify JSON String">
                        <Button onClick={handleMinifyFormatString} icon={<FileTextFilled />} />
                    </Tooltip>
                    <Tooltip title="Copy JSON">
                        <Button onClick={handleCopyText} icon={<CopyOutlined />} />
                    </Tooltip>
                </Space>
            </div>
            <div className="tool-bar">
                <b style={{ paddingLeft: '5px' }}>{path}</b>
            </div>
            <div className="json-tree" ref={treewrapRef}>
                <Tree
                    ref={treeRef}
                    showLine
                    showIcon
                    autoExpandParent
                    expandedKeys={expandedKeys}
                    selectedKeys={selectedKeys}
                    treeData={jsonTree}
                    onExpand={handleExpand}
                    onSelect={handleSelect}
                    height={treeHeight}
                    titleRender={renderNode}
                />
            </div>
        </div>
    );
});

export default memo(JsonViewer);
