import { useEffect, useState } from 'react';

// Runs an async function and tracks { data, loading, error }. Call reload() to fetch again.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((e) => !cancelled && setState((s) => ({ ...s, loading: false, error: e.message })));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Local dates (not UTC) so "today" is correct in your timezone
const localISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();
export const today = () => localISO().slice(0, 10);
export const thisMonth = () => localISO().slice(0, 7);
