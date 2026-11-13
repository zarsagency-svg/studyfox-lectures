"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toDashClearKeys, type PlaybackKind } from "@/lib/playback";

export type VideoSource = {
  url: string;
  kind: PlaybackKind;
  /** ClearKey map (kidHex -> keyHex) as returned by the PW video API. */
  clearKeys?: Record<string, string>;
};

function errorText(kind: PlaybackKind, detail?: string) {
  if (detail && /nomodule|not supported|generate request|key system/i.test(detail)) {
    return "Ye browser is video ko decrypt nahi kar paya. Chrome / Edge / Firefox par try karo.";
  }
  if (detail && /403|missingkey|forbidden/i.test(detail)) {
    return "Video server ne request reject kar di (403). Link expire ho gaya hai — dobara open karo.";
  }
  if (kind === "dash") return "Video load nahi hua. Dobara try karo.";
  return "Video load nahi ho paya. Network check karke retry karo.";
}

export default function VideoPlayer({
  source,
  poster,
  title,
}: {
  source: VideoSource;
  poster?: string;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError("");
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source?.url) return;

    let disposed = false;
    let hls: any = null;
    let dash: any = null;

    setError("");
    setLoading(true);

    const fail = (detail?: string) => {
      if (disposed) return;
      setLoading(false);
      setError(errorText(source.kind, detail));
    };

    const init = async () => {
      try {
        if (source.kind === "dash") {
          const mod: any = await import("dashjs");
          if (disposed) return;
          const dashjs = mod.default || mod;
          dash = dashjs.MediaPlayer().create();

          dash.updateSettings({
            debug: { logLevel: 0 },
            streaming: {
              buffer: { fastSwitchEnabled: true, bufferTimeAtTopQuality: 30 },
              retryAttempts: { MPD: 2, MediaSegment: 3 },
            },
          });

          // The PW DASH streams are CENC encrypted with a ClearKey (W3C) system.
          // Without these keys playback stops right after the manifest loads.
          const clearKeys = toDashClearKeys(source.clearKeys || {});
          if (Object.keys(clearKeys).length > 0) {
            dash.setProtectionData({ "org.w3.clearkey": { clearkeys: clearKeys } });
          }

          dash.on("error", (e: any) => {
            const err = e?.error || {};
            fail(`${err.code ?? ""} ${err.message ?? ""}`.trim());
          });

          dash.initialize(video, source.url, false);
          video.play().catch(() => {});
          return;
        }

        if (source.kind === "hls") {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source.url;
            video.load();
            video.play().catch(() => {});
            return;
          }
          const Hls = (await import("hls.js")).default;
          if (disposed) return;
          if (!Hls.isSupported()) {
            video.src = source.url;
            video.load();
            return;
          }
          hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hls.loadSource(source.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!disposed) video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
            if (data?.fatal) fail(`${data?.details || ""} ${data?.response?.code || ""}`);
          });
          return;
        }

        video.src = source.url;
        video.load();
        video.play().catch(() => {});
      } catch (e: any) {
        fail(e?.message);
      }
    };

    init();

    const onCanPlay = () => {
      if (!disposed) setLoading(false);
    };
    const onError = () => {
      if (source.kind === "file") fail(video.error?.message);
    };
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadeddata", onCanPlay);
    video.addEventListener("error", onError);

    // Safety net: never leave the spinner up forever.
    const guard = setTimeout(() => {
      if (!disposed) setLoading(false);
    }, 25000);

    return () => {
      disposed = true;
      clearTimeout(guard);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadeddata", onCanPlay);
      video.removeEventListener("error", onError);
      try {
        if (hls) hls.destroy();
      } catch {}
      try {
        if (dash) dash.reset();
      } catch {}
      try {
        video.removeAttribute("src");
        video.load();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.url, source?.kind, JSON.stringify(source?.clearKeys || {}), attempt]);

  if (!source?.url) {
    return (
      <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
        Video URL nahi mila
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black"
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
      />
      {error && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-red-500/90 text-white text-xs px-3 py-2">
          <span className="min-w-0">{error}</span>
          <button
            onClick={retry}
            className="shrink-0 px-3 py-1 rounded-full bg-white/20 font-bold active:scale-95"
          >
            Retry
          </button>
        </div>
      )}
      {title && <div className="sr-only">{title}</div>}
    </div>
  );
}
