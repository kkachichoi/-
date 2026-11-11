import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import timeline from "./timeline.json";

type Shot = {
  p?: string;
  x?: number;
  y?: number;
  z?: number;
  collage?: string[];
  logo?: boolean;
  from: number;
  to: number;
};

const photos = timeline.photos as Record<string, string>;
const FONT = "KkachiSans";

// Load the Korean font before rendering any frame.
const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = [
      new FontFace(FONT, `url(${staticFile("font-kr-500.woff2")})`, { weight: "500" }),
      new FontFace(FONT, `url(${staticFile("font-latin-500.woff2")})`, { weight: "500" }),
      new FontFace(FONT, `url(${staticFile("font-kr-700.woff2")})`, { weight: "700" }),
      new FontFace(FONT, `url(${staticFile("font-latin-700.woff2")})`, { weight: "700" }),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
};

// A photo cropped around a focus point, slowly pushing in (like a handheld close-up).
const Photo: React.FC<{ p: string; x: number; y: number; z: number; len: number }> = ({ p, x, y, z, len }) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, Math.max(len, 1)], [1, 1.07], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Img
        src={staticFile(photos[p])}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${x}% ${y}%`,
          transform: `scale(${z * push})`,
          transformOrigin: `${x}% ${y}%`,
        }}
      />
    </AbsoluteFill>
  );
};

// Three photos popping in on a dark background (like the original's 3-panel collage).
const Collage: React.FC<{ items: string[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spots = [
    { left: 70, top: 260, w: 470, h: 640 },
    { left: 560, top: 470, w: 450, h: 610 },
    { left: 110, top: 1010, w: 470, h: 640 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#151515 0%,#2a2a2a 100%)" }}>
      {items.map((it, i) => {
        const [p, x, y, z] = it.split(":");
        const s = spring({ frame: frame - i * 8, fps, config: { damping: 200 } });
        const sp = spots[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: sp.left,
              top: sp.top,
              width: sp.w,
              height: sp.h,
              overflow: "hidden",
              opacity: s,
              transform: `translateY(${(1 - s) * 40}px)`,
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
          >
            <Img
              src={staticFile(photos[p])}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${x}% ${y}%`,
                transform: `scale(${z})`,
                transformOrigin: `${x}% ${y}%`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Closing card with the magpie logo, like the original's brand outro.
const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const t = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 42%, #4a4a4a 0%, #2c2c2c 55%, #1f1f1f 100%)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img src={staticFile(photos["11"])} style={{ width: 760, height: 760, opacity: a, marginTop: -180 }} />
      <div
        style={{
          position: "absolute",
          top: 1250,
          width: "100%",
          textAlign: "center",
          color: "#fff",
          opacity: t,
          transform: `translateY(${(1 - t) * 20}px)`,
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: 4 }}>까치카페</div>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: 8, marginTop: 18, opacity: 0.75 }}>
          KKACHI SPECIALTY COFFEE
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ShotView: React.FC<{ shot: Shot }> = ({ shot }) => {
  const len = shot.to - shot.from;
  if (shot.logo) return <Logo />;
  if (shot.collage) return <Collage items={shot.collage} />;
  return <Photo p={shot.p!} x={shot.x!} y={shot.y!} z={shot.z!} len={len} />;
};

// White one-line subtitle a little below the centre, as in the original.
const Subtitle: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
    <div
      style={{
        position: "absolute",
        top: 1270,
        maxWidth: 960,
        textAlign: "center",
        color: "#fff",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 50,
        lineHeight: 1.3,
        textShadow: "0 0 10px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.6)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  </AbsoluteFill>
);

export const KkachiShort: React.FC = () => {
  useFonts();
  const { durationInFrames } = useVideoConfig();
  const shots: Shot[] = timeline.scenes.flatMap((s) => s.shots as Shot[]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shots.map((sh, i) => (
        <Sequence key={`shot${i}`} from={sh.from} durationInFrames={Math.max(1, sh.to - sh.from)}>
          <ShotView shot={sh} />
        </Sequence>
      ))}
      {timeline.subs.map((s, i) => (
        <Sequence key={`sub${i}`} from={s.from} durationInFrames={Math.max(1, s.to - s.from)}>
          <Subtitle text={s.text} />
        </Sequence>
      ))}
      {timeline.audio.map((a, i) => (
        <Sequence key={`vo${i}`} from={a.from}>
          <Audio src={staticFile(a.src)} />
        </Sequence>
      ))}
      <Audio
        src={staticFile("music.wav")}
        volume={(f) =>
          interpolate(f, [0, 30, durationInFrames - 60, durationInFrames], [0, 0.13, 0.13, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
