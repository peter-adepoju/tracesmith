"use client";

import { useState } from "react";
import { VIDEOS, type VideoKey } from "@/lib/videos";

/**
 * An embedded, verified video.
 *
 * Renders a thumbnail first and only loads the YouTube iframe on click, so a
 * lesson with several videos still opens instantly and nothing is requested
 * from YouTube until you actually want to watch.
 */
export function Video({ id }: { id: VideoKey }) {
  const video = VIDEOS[id];
  const [playing, setPlaying] = useState(false);

  if (!video) {
    return (
      <div className="my-6 rounded-xl border border-bad/40 bg-bad-soft p-4 text-sm">
        Unknown video key: <code>{id}</code>
      </div>
    );
  }

  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-video bg-surface-2">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Play: ${video.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/40">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 h-6 w-6 fill-black"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="space-y-1 border-t border-border p-3 text-sm">
        <div className="font-medium">{video.title}</div>
        <div className="text-xs text-muted">
          {video.channel} · {video.length} ·{" "}
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            watch on YouTube
          </a>
        </div>
        <div className="pt-1 text-xs text-muted italic">{video.why}</div>
      </figcaption>
    </figure>
  );
}
