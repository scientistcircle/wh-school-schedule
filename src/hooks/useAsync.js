import { useCallback, useEffect, useRef, useState } from 'react';

// Hook generik: jalankan fungsi async, lacak loading/error/data.
export function useAsync(fn, deps = [], options = {}) {
  const { skip = false } = options;
  const [state, setState] = useState({
    loading: !skip,
    error: null,
    data: null,
    notFound: false,
  });
  const aliveRef = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState({ loading: true, error: null, data: null, notFound: false });
    const res = await fnRef.current();
    if (!aliveRef.current) return;
    if (res?.error) {
      setState({ loading: false, error: res.error, data: null, notFound: false });
    } else if (res?.notFound) {
      setState({ loading: false, error: null, data: null, notFound: true });
    } else {
      setState({
        loading: false,
        error: null,
        data: res?.data ?? res ?? null,
        notFound: false,
      });
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    if (skip) {
      setState({ loading: false, error: null, data: null, notFound: false });
      return () => {
        aliveRef.current = false;
      };
    }
    run();
    return () => {
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: run };
}