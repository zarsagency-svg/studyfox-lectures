"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import BatchCard from "@/components/BatchCard";
import { fetchBatches, searchBatches } from "@/lib/api";

function Skeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 space-y-4 overflow-hidden">
      <div className="shimmer h-7 rounded-full w-3/4" />
      <div className="shimmer h-44 rounded-2xl" />
      <div className="shimmer h-4 rounded-full w-1/2" />
      <div className="shimmer h-4 rounded-full w-3/4" />
      <div className="flex gap-2">
        <div className="shimmer h-9 rounded-full w-1/2" />
        <div className="shimmer h-9 rounded-full w-1/2" />
      </div>
    </div>
  );
}

function PromoCarousel() {
  const [items, setItems] = useState<any[]>([
    { text: "Get Up To 90% Scholarship", grad: "linear-gradient(120deg,#1E3A8A,#2563EB)", img: "/banners/banner1.jpg" },
    { text: "New Batches Every Week", grad: "linear-gradient(120deg,#1651a3,#3b82f6)", img: "/banners/banner2.jpg" },
    { text: "100% Free For Students", grad: "linear-gradient(120deg,#1651a3,#2563EB)", img: "/banners/banner3-study.jpg" },
  ]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    fetch("/api/promos", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.items && Array.isArray(d.items) && d.items.length) setItems(d.items.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const len = items.length || 1;
  useEffect(() => {
    timer.current = setInterval(() => setIdx((v) => (v + 1) % len), 4000);
    return () => clearInterval(timer.current);
  }, [len]);

  return (
    <div className="relative rounded-xl overflow-hidden mb-8">
      <div className="grid">
        {items.map((t: any, i: number) => (
          <div
            key={i}
            className={`col-start-1 row-start-1 transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {t.link ? (
              <a href={t.link} target="_blank" rel="noopener noreferrer" className="block w-full">
                <img src={t.img} alt="" className="w-full h-auto block" draggable={false} />
              </a>
            ) : (
              <img src={t.img} alt="" className="w-full h-auto block" draggable={false} />
            )}
          </div>
        ))}
      </div>
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIdx(i);
              clearInterval(timer.current);
            }}
            className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(
    async (p: number, q: string, signal?: AbortSignal) => {
      if (q) return searchBatches(q, p, { signal });
      return fetchBatches(p, { signal });
    },
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await load(1, "");
        if (!alive) return;
        setBatches(r.batches || []);
        setTotalPages(r.totalPages || 1);
        setPage(1);
        setLoading(false);
        setFailed(r.success === false);
      } catch {
        if (!alive) return;
        setLoading(false);
        setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    const id = ++reqId.current;
    const controller = new AbortController();
    const q = query.trim();
    setLoading(true);
    setFailed(false);
    (async () => {
      try {
        const r = q ? await searchBatches(q, 1, { signal: controller.signal }) : await fetchBatches(1, { signal: controller.signal });
        if (id !== reqId.current) return;
        setBatches(r.batches || []);
        setTotalPages(r.totalPages || 1);
        setPage(1);
        setActiveQuery(q);
        setLoading(false);
        setFailed(r.success === false);
      } catch (e: any) {
        if (id !== reqId.current || e?.name === "AbortError") return;
        setLoading(false);
        setFailed(true);
      }
    })();
    return () => {
      reqId.current = id + 1;
      controller.abort();
    };
  }, [query]);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    const r = await load(next, activeQuery);
    setBatches((prev) => [...prev, ...(r.batches || [])]);
    setTotalPages(r.totalPages || next);
    setPage(next);
    setLoadingMore(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      <div className="glass-card !rounded-2xl p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-5">Batches</h1>

        <div className="flex items-center bg-gradient-to-b from-white to-gray-50/80 dark:bg-slate-900/40 dark:from-transparent border border-spring-leaf/15 rounded-2xl shadow-spring-sm mb-8 focus-within:border-spring-leaf/40 focus-within:shadow-[0_0_20px_rgba(37,99,235,0.2)] overflow-hidden">
          <Search className="w-5 h-5 text-spring-leaf ml-4 flex-shrink-0" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Your Batch"
            className="flex-1 min-w-0 px-3 py-3.5 bg-transparent outline-none text-sm"
          />
          <button className="flex-shrink-0 m-1.5 px-6 sm:px-8 py-2.5 rounded-full text-white text-sm font-semibold bg-gradient-to-b from-spring-mint to-spring-leaf hover:from-spring-mint hover:to-spring-mint-dark active:scale-95 transition-all shadow-md">
            Search
          </button>
        </div>

        <PromoCarousel />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} />)
            : batches.map((b, i) => <BatchCard key={b._id || b.id || i} b={b} />)}
        </div>

        {!loading && failed && <div className="text-center text-muted-foreground py-12">Kuch load nahi hua, dobara try karo.</div>}
        {!loading && !failed && batches.length === 0 && (
          <div className="text-center text-muted-foreground py-12">No batches found.</div>
        )}
        {!loading && !failed && page < totalPages && (
          <div className="flex justify-center mt-8">
            <button onClick={loadMore} disabled={loadingMore} className="spring-btn-ghost disabled:opacity-60">
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
