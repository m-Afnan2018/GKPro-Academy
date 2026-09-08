"use client";
import { useEffect, useRef } from "react";
import type HlsType from "hls.js";
import "plyr/dist/plyr.css";
import styles from "./VideoPlayer.module.css";

// plyr's shipped .d.ts mixes `export =`/`export default`, which trips up a typed
// default import under this tsconfig — type the instance loosely instead.
type PlyrInstance = { destroy: () => void };

interface Props {
  src: string;
  /** Optional adaptive-bitrate (HLS master playlist) URL, without a `?token=` query — auth is sent as a header instead (see `token`). Falls back to `src` (plain MP4) when absent or unsupported. */
  hlsSrc?: string | null;
  /** JWT sent as `Authorization: Bearer` on every hls.js request. Required for `hlsSrc` to load, since hls.js resolves segment/sub-playlist URLs relative to the manifest and drops any query string on it. */
  token?: string | null;
  title?: string;
  poster?: string;
}

const BASE_CONTROLS = {
  controls: [
    "play-large", "play", "progress", "current-time",
    "mute", "volume", "settings", "pip", "fullscreen",
  ],
  disableContextMenu: true,
};

// Plyr (MIT) replaces native video chrome so no "download" affordance is shown; deters casual saving only, not devtools/screen capture.
export default function VideoPlayer({ src, hlsSrc, token, title, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    let player: PlyrInstance | undefined;
    let hls: HlsType | undefined;

    async function setup() {
      const video = videoRef.current;
      if (!video) return;
      const { default: PlyrCtor } = await import("plyr");
      if (cancelled || !video) return;

      if (hlsSrc) {
        const { default: Hls } = await import("hls.js");
        if (cancelled || !video) return;
        if (Hls.isSupported()) {
          // Native <video src> can't carry the requests hls.js issues for each variant
          // playlist/segment, so auth is a header on every hls.js XHR instead of a query param.
          hls = new Hls({
            xhrSetup: (xhr: XMLHttpRequest) => {
              if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            },
          } as any);
          hls.loadSource(hlsSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled || !hls) return;
            const qualities = [...new Set(hls.levels.map((l) => l.height))].sort((a, b) => b - a);
            player = new PlyrCtor(video, {
              ...BASE_CONTROLS,
              settings: ["quality", "speed"],
              quality: {
                default: 0,
                options: [0, ...qualities],
                forced: true,
                onChange: (newQuality: number) => {
                  if (!hls) return;
                  if (newQuality === 0) { hls.currentLevel = -1; return; }
                  const idx = hls.levels.findIndex((l) => l.height === newQuality);
                  if (idx !== -1) hls.currentLevel = idx;
                },
              },
              i18n: { qualityLabel: { 0: "Auto" } },
            } as any);
          });
          return;
        }
      }

      // Plain MP4 fallback — hls.js unsupported, or no hlsSrc (not yet transcoded)
      video.src = src;
      player = new PlyrCtor(video, { ...BASE_CONTROLS, settings: ["speed"] } as any);
    }

    setup();

    return () => {
      cancelled = true;
      player?.destroy();
      hls?.destroy();
    };
  }, [src, hlsSrc, token]);

  return (
    <div className={styles.wrap}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        playsInline
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        poster={poster}
        title={title}
        className={styles.video}
      >
        {!hlsSrc && <source src={src} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
