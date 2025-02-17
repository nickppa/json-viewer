import { useRef, useCallback } from "react";
import debounce from "lodash.debounce";

function useDebounce(fn, ms) {
    const fRef = useRef();
    fRef.current = fn;

    const result = useCallback(
        debounce((...args) => fRef.current(...args), ms),
        []
    );
    return result;
}

export default useDebounce;
