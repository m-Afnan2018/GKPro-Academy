"use client";
import { useEffect, useRef } from "react";
import type Plyr from "plyr";
import "plyr/dist/plyr.css";
import styles from "./VideoPlayer.module.css";

interface Props {
  src: string;
  title?: string;
  poster?: string;
}

// Plyr (MIT) replaces native video chrome so no "download" affordance is shown; deters casual saving only, not devtools/screen capture.
export default function VideoPlayer({ src, title, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let player: Plyr | undefined;
    let cancelled = false;

    import("plyr").then(({ default: PlyrCtor }) => {
      if (cancelled || !videoRef.current) return;
      player = new PlyrCtor(videoRef.current, {
        controls: [
          "play-large", "play", "progress", "current-time",
          "mute", "volume", "settings", "pip", "fullscreen",
        ],
        settings: ["speed"],
        disableContextMenu: true,
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [src]);

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
        style={{ width: "100%", maxHeight: 480 }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
