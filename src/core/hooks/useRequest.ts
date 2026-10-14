/**
 * Tải dữ liệu từ API trong màn React: chạy lại khi `key` đổi, bỏ kết quả của lần tải đã cũ (unmount / đổi key).
 * Chống nháy màn:
 *   - kết quả mới nhất của mỗi `key` được giữ trong bộ nhớ (cả phiên): mở lại màn thì hiện ngay rồi tải lại ngầm
 *   - đổi `key` (đổi tab WEEK / MONTH...) thì vẫn trả dữ liệu cũ (`stale: true` để màn làm mờ) tới khi có dữ liệu mới
 *   - `loading` chỉ true khi không có gì để hiện; đang có dữ liệu mà tải lại thì `isRefreshing`
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface RequestState<T> {
  /** Dữ liệu đang hiện: của `key` hiện tại, cache của nó, hoặc của key trước (xem `stale`) */
  data: T | null;
  error: unknown;
  /** Đang tải mà chưa có gì để hiện -> màn chờ lớn */
  loading: boolean;
  /** Đang tải lại nhưng đã có `data` -> chỉ hiện chấm nhỏ */
  isRefreshing: boolean;
  /** `data` thuộc key trước (vừa đổi tab) -> làm mờ tới khi có dữ liệu mới */
  stale: boolean;
  reload: () => void;
}

/** Kết quả mới nhất theo key (bộ nhớ, cả phiên) */
const cache = new Map<string, unknown>();

export function clearRequestCache(): void {
  cache.clear();
}

interface Settled<T> {
  key: string;
  version: number;
  data: T | null;
  error: unknown;
}

export function useRequest<T>(load: () => Promise<T>, key: string): RequestState<T> {
  // Hàm tải mới nhất (không đưa vào deps: chỉ tải lại khi `key` đổi hoặc gọi `reload`)
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  // Lần tải đã xong gần nhất; `version` tăng khi gọi `reload`
  const [settled, setSettled] = useState<Settled<T>>({ key, version: -1, data: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadRef
      .current()
      .then((data) => {
        cache.set(key, data);
        if (active) setSettled({ key, version, data, error: null });
      })
      .catch((error: unknown) => active && setSettled({ key, version, data: null, error }));
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  const fetching = settled.key !== key || settled.version !== version;
  const cached = cache.get(key) as T | undefined;
  const current = settled.key === key;
  // Cùng key: dữ liệu đã tải; khác key: cache của key mới, không có thì giữ dữ liệu cũ (stale)
  const data = current ? settled.data : (cached ?? settled.data);
  const stale = !current && cached === undefined && settled.data !== null;
  return {
    data,
    error: current ? settled.error : null,
    loading: fetching && data === null,
    isRefreshing: fetching && data !== null,
    stale,
    reload,
  };
}
