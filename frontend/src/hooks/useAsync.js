import { useCallback, useEffect, useState } from "react";

// Runs an async function and tracks its state.
// - loading:    true only for the very first load (no data yet) -> show skeletons
// - refreshing: true while re-fetching with data already on screen -> dim the UI
export function useAsync(fn, deps = []) {
    const [state, setState] = useState({ data: null, error: null, pending: true });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState((s) => ({ ...s, error: null, pending: true }));

        fn()
            .then((data) => {
                if (!cancelled) setState({ data, error: null, pending: false });
            })
            .catch((error) => {
                if (!cancelled) setState((s) => ({ ...s, error, pending: false }));
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]);

    const refetch = useCallback(() => setTick((t) => t + 1), []);

    return {
        data: state.data,
        error: state.error,
        loading: state.pending && state.data === null,
        refreshing: state.pending && state.data !== null,
        refetch,
    };
}