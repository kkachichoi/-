import "@fontsource/nanum-pen-script/400.css";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const HAND = "'Nanum Pen Script', cursive";
const ALL_TEXT = "나를 살아 있게 하는 것들에 더 많은 자리를 오늘도, 바다를 그리러";

// Slow zoom on the photo (Ken Burns).
const Photo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <Img
      src={staticFile("me.jpg")}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "50% 35%",
        scale: interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        }),
      }}
    />
  );
};

// A layer of moving sea waves, drawn as a sine path that drifts with time.
const Wave: React.FC<{
  readonly color: string;
  readonly top: number;
  readonly amp: number;
  readonly length: number;
  readonly speed: number;
}> = ({ color, top, amp, length, speed }) => {
  const frame = useCurrentFrame();
  const W = 1080;
  const H = 1920;
  const shift = frame * speed;
  let d = `M 0 ${H} L 0 ${top}`;
  for (let x = 0; x <= W; x += 20) {
    const y = top + Math.sin(((x + shift) / length) * Math.PI * 2) * amp;
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  d += ` L ${W} ${H} Z`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={d} fill={color} />
    </svg>
  );
};

const Sea: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        translate: interpolate(frame, [0, 1.5 * fps], ["0px 800px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <Wave color="rgba(120, 200, 220, 0.35)" top={1180} amp={24} length={540} speed={3} />
      <Wave color="rgba(40, 150, 190, 0.45)" top={1260} amp={18} length={420} speed={-4} />
      <Wave color="rgba(12, 70, 115, 0.78)" top={1350} amp={14} length={360} speed={5} />
      <Wave color="rgba(255, 255, 255, 0.25)" top={1400} amp={8} length={260} speed={-6} />
    </AbsoluteFill>
  );
};

const Line: React.FC<{ readonly name: string; readonly size: number; readonly children: string }> = ({
  name,
  size,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Interactive.Div
      name={name}
      style={{
        fontFamily: HAND,
        fontSize: size,
        color: "#ffffff",
        textAlign: "center",
        whiteSpace: "nowrap",
        lineHeight: 1.1,
        textShadow: "0 4px 24px rgba(0,0,0,0.45)",
        opacity: interpolate(frame, [0, 0.8 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0, 1 * fps], ["0px 30px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

export const SeaReel: React.FC = () => {
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading handwriting font"));
  useEffect(() => {
    document.fonts.load(`120px 'Nanum Pen Script'`, ALL_TEXT).then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b3d5c" }}>
      <Photo />
      {/* Soft sea-blue tint, darker at the top so the text reads well */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,50,80,0.25) 0%, rgba(10,50,80,0.0) 30%, rgba(20,110,150,0.15) 75%, rgba(10,60,100,0.35) 100%)",
        }}
      />
      <Sea />
      <AbsoluteFill
        style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1430, gap: 6 }}
      >
        <Sequence name="문구 1" from={Math.round(0.8 * fps)} layout="none">
          <Line name="문구 1" size={100}>나를 살아 있게 하는 것들에</Line>
        </Sequence>
        <Sequence name="문구 2" from={Math.round(2.2 * fps)} layout="none">
          <Line name="문구 2" size={136}>더 많은 자리를</Line>
        </Sequence>
        <Sequence name="마무리 문구" from={Math.round(4.5 * fps)} layout="none">
          <Line name="마무리 문구" size={78}>오늘도, 바다를 그리러 🌊</Line>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
