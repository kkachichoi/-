import "@fontsource/nanum-pen-script/400.css";
import "@fontsource/noto-sans-kr/900.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Img, staticFile } from "remotion";

// Source painting is 1122 x 1402.
const SRC_W = 1122;
const SRC_H = 1402;
const HAND = "'Nanum Pen Script', cursive";
const BOLD = "'Noto Sans KR', sans-serif";
const NAVY = "#24396b";

type Crop = { x: number; y: number; w: number; h: number };
type Bubble = {
  text: string;
  left: number;
  top: number;
  size?: number;
  tail?: "left" | "right" | "none";
  shout?: boolean;
};

export type ToonProps = {
  readonly page: number;
  readonly crop: Crop;
  readonly narration?: string;
  readonly bubbles: Bubble[];
  readonly sfx?: { text: string; left: number; top: number; rotate: number };
  readonly caption?: string;
};

const PANEL = { left: 60, top: 150, w: 960, h: 1000 };

// Show a rectangle of the painting so it covers the panel box.
const CroppedPainting: React.FC<{ crop: Crop }> = ({ crop }) => {
  const scale = Math.max(PANEL.w / crop.w, PANEL.h / crop.h);
  const cx = crop.x + crop.w / 2;
  const cy = crop.y + crop.h / 2;
  return (
    <Img
      src={staticFile("tiger.png")}
      style={{
        position: "absolute",
        width: SRC_W * scale,
        height: SRC_H * scale,
        left: PANEL.w / 2 - cx * scale,
        top: PANEL.h / 2 - cy * scale,
      }}
    />
  );
};

const SpeechBubble: React.FC<Bubble> = ({ text, left, top, size = 68, tail = "left", shout }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      padding: "18px 40px 22px",
      backgroundColor: "#fffdf6",
      border: `6px solid ${NAVY}`,
      borderRadius: shout ? 18 : 60,
      fontFamily: HAND,
      fontSize: size,
      color: NAVY,
      lineHeight: 1.05,
      whiteSpace: "pre",
      boxShadow: "6px 8px 0 rgba(36,57,107,0.25)",
    }}
  >
    {text}
    {tail !== "none" ? (
      <div
        style={{
          position: "absolute",
          bottom: -34,
          [tail]: 60,
          width: 0,
          height: 0,
          borderLeft: "22px solid transparent",
          borderRight: "22px solid transparent",
          borderTop: `36px solid ${NAVY}`,
        }}
      />
    ) : null}
  </div>
);

export const TigerToon: React.FC<ToonProps> = ({ page, crop, narration, bubbles, sfx, caption }) => {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    const all = [narration, caption, sfx?.text, ...bubbles.map((b) => b.text)].join(" ");
    Promise.all([
      document.fonts.load(`68px 'Nanum Pen Script'`, all),
      document.fonts.load(`900 40px 'Noto Sans KR'`, all + "0123456789/"),
    ]).then(() => continueRender(handle));
  }, [handle, narration, caption, sfx, bubbles]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#f6efe0" }}>
      {/* Header: series title + page number */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: BOLD,
          fontWeight: 900,
          color: NAVY,
        }}
      >
        <div style={{ fontSize: 50 }}>봄 깨우는 호랑이 🐯</div>
        <div
          style={{
            fontSize: 40,
            backgroundColor: "#f2a43a",
            color: "#fff",
            borderRadius: 40,
            padding: "6px 26px",
          }}
        >
          {page}/4
        </div>
      </div>

      {/* Comic panel */}
      <div
        style={{
          position: "absolute",
          ...PANEL,
          width: PANEL.w,
          height: PANEL.h,
          overflow: "hidden",
          border: `8px solid ${NAVY}`,
          borderRadius: 28,
          boxSizing: "border-box",
        }}
      >
        <CroppedPainting crop={crop} />
        {narration ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              padding: "16px 34px",
              backgroundColor: "#fffdf6",
              borderRight: `6px solid ${NAVY}`,
              borderBottom: `6px solid ${NAVY}`,
              borderBottomRightRadius: 20,
              fontFamily: HAND,
              fontSize: 58,
              color: NAVY,
            }}
          >
            {narration}
          </div>
        ) : null}
        {sfx ? (
          <div
            style={{
              position: "absolute",
              left: sfx.left,
              top: sfx.top,
              rotate: `${sfx.rotate}deg`,
              fontFamily: BOLD,
              fontWeight: 900,
              fontSize: 120,
              color: "#f2a43a",
              WebkitTextStroke: `10px ${NAVY}`,
              paintOrder: "stroke fill",
            }}
          >
            {sfx.text}
          </div>
        ) : null}
        {bubbles.map((b) => (
          <SpeechBubble key={b.text} {...b} />
        ))}
      </div>

      {/* Bottom caption */}
      <div
        style={{
          position: "absolute",
          top: PANEL.top + PANEL.h + 40,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: HAND,
          fontSize: 76,
          color: NAVY,
        }}
      >
        {caption ?? ""}
      </div>
    </AbsoluteFill>
  );
};
