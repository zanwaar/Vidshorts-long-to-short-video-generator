import { AbsoluteFill, Html5Video, useCurrentFrame, useVideoConfig } from "remotion";

export type ShortVideoCaption = {
  cueIndex: number;
  startTime: number;
  endTime: number;
  text: string;
  speaker: number | null;
};

export type ShortVideoPreviewProps = {
  videoUrl: string;
  title: string;
  trimBefore: number;
  trimAfter: number;
  captions: ShortVideoCaption[];
};

function splitCaptionText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= 22) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

function getActiveCue(captions: ShortVideoCaption[], seconds: number) {
  return (
    captions.find((cue) => cue.startTime <= seconds && cue.endTime > seconds) ?? null
  );
}

export function ShortVideoPreview({
  videoUrl,
  title,
  trimBefore,
  trimAfter,
  captions,
}: ShortVideoPreviewProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;
  const activeCue = getActiveCue(captions, currentTimeInSeconds);
  const captionLines = activeCue ? splitCaptionText(activeCue.text) : [];
  const durationInSeconds = Math.max(1, Math.round((trimAfter - trimBefore) / fps));

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at top, rgba(126, 210, 255, 0.28), transparent 30%), linear-gradient(180deg, #040816 0%, #070b17 48%, #02040c 100%)",
      }}
    >
      <Html5Video
        src={videoUrl}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        pauseWhenBuffering
        style={{
          height: "100%",
          width: "100%",
          objectFit: "cover",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(4, 8, 22, 0.22) 0%, rgba(4, 8, 22, 0) 28%, rgba(4, 8, 22, 0.1) 55%, rgba(4, 8, 22, 0.82) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          top: 34,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          style={{
            maxWidth: 680,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(2, 6, 23, 0.56)",
            padding: "12px 18px",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.62)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 19,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            AI short preview
          </div>
          <div
            style={{
              marginTop: 8,
              color: "white",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.12,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(9, 14, 30, 0.6)",
            padding: "12px 18px",
            color: "white",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 24,
            fontWeight: 600,
            backdropFilter: "blur(18px)",
          }}
        >
          {durationInSeconds}s
        </div>
      </div>

      {activeCue ? (
        <div
          style={{
            position: "absolute",
            left: 42,
            right: 42,
            bottom: 58,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              borderRadius: 38,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(3, 7, 18, 0.82)",
              padding: "24px 28px 26px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(24px)",
            }}
          >
            {activeCue.speaker !== null ? (
              <div
                style={{
                  color: "rgba(126, 210, 255, 0.96)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Speaker {activeCue.speaker}
              </div>
            ) : null}

            <div
              style={{
                marginTop: activeCue.speaker !== null ? 12 : 0,
                color: "white",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.02,
                textAlign: "center",
                textWrap: "balance",
              }}
            >
              {captionLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
