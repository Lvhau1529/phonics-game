/**
 * Tải dữ liệu từ API trong màn React: chạy lại khi `key` đổi, bỏ kết quả của lần tải đã cũ (unmount / đổi key).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface RequestState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  reload: () => void;
}

export function useRequest<T>(load: () => Promise<T>, key: string): RequestState<T> {
  // Hàm tải mới nhất (không đưa vào deps: chỉ tải lại khi `key` đổi hoặc gọi `reload`)
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const [state, setState] = useState<{ data: T | null; error: unknown; loading: boolean; key: string }>({
    data: null,
    error: null,
    loading: true,
    key,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadRef
      .current()
      .then((data) => active && setState({ data, error: null, loading: false, key }))
      .catch((error: unknown) => active && setState({ data: null, error, loading: false, key }));
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  // Đổi key: coi như đang tải (không hiện dữ liệu của key cũ)
  const stale = state.key !== key;
  return {
    data: stale ? null : state.data,
    error: stale ? null : state.error,
    loading: stale || state.loading,
    reload,
  };
}
