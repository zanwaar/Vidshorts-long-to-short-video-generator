"use client";

import { type ComponentProps, useMemo } from "react";
import { Player, Thumbnail } from "@remotion/player";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  ShortVideoPreview,
  type ShortVideoCaption,
} from "@/remotion/short-video-preview";

const SHORT_PLAYER_FPS = 30;
const SHORT_PLAYER_WIDTH = 1080;
const SHORT_PLAYER_HEIGHT = 1920;

function toFrames(seconds: number) {
  return Math.max(0, Math.round(seconds * SHORT_PLAYER_FPS));
}

function ShortVideoPoster({
  durationInFrames,
  inputProps,
}: {
  durationInFrames: number;
  inputProps: ComponentProps<typeof Player>["inputProps"];
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Thumbnail
        component={ShortVideoPreview}
        inputProps={inputProps}
        frameToDisplay={0}
        durationInFrames={durationInFrames}
        compositionWidth={SHORT_PLAYER_WIDTH}
        compositionHeight={SHORT_PLAYER_HEIGHT}
        fps={SHORT_PLAYER_FPS}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-[1.4rem] border border-white/12 bg-slate-950/72 p-4 backdrop-blur-xl">
        <p className="text-[0.68rem] uppercase tracking-[0.26em] text-sky-200/72">
          Short clip preview
        </p>
        <p className="mt-2 text-sm font-medium text-white/92">
          Press play to review the generated segment with synced captions.
        </p>
      </div>
    </div>
  );
}

export function ShortVideoPlayer({
  videoUrl,
  title,
  startTime,
  endTime,
  captions,
}: {
  videoUrl: string;
  title: string;
  startTime: number;
  endTime: number;
  captions: ShortVideoCaption[];
}) {
  const trimBefore = toFrames(startTime);
  const trimAfter = Math.max(trimBefore + 1, toFrames(endTime));
  const durationInFrames = Math.max(1, trimAfter - trimBefore);
  const inputProps = useMemo(
    () => ({
      videoUrl,
      title,
      trimBefore,
      trimAfter,
      captions,
    }),
    [captions, title, trimAfter, trimBefore, videoUrl]
  );

  return (
    <AspectRatio
      ratio={9 / 16}
      className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <Player
        component={ShortVideoPreview}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        compositionWidth={SHORT_PLAYER_WIDTH}
        compositionHeight={SHORT_PLAYER_HEIGHT}
        fps={SHORT_PLAYER_FPS}
        controls
        clickToPlay
        showPosterWhenUnplayed
        showPosterWhenEnded
        posterFillMode="player-size"
        renderPoster={() => (
          <ShortVideoPoster
            durationInFrames={durationInFrames}
            inputProps={inputProps}
          />
        )}
        style={{
          height: "100%",
          width: "100%",
        }}
      />
    </AspectRatio>
  );
}
