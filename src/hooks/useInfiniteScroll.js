import { useEffect, useRef, useCallback } from "react";

const useInfiniteScroll = (
  onLoadMore,
  { hasMore, loading, threshold = 0.1 } = {},
) => {
  const sentinelRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);

  // Luôn giữ callback mới nhất, tránh stale closure
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          onLoadMoreRef.current?.();
        }
      },
      { threshold },
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loading, threshold]);

  return sentinelRef;
};

export default useInfiniteScroll;
