import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/900.css";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Composition,
  continueRender,
  delayRender,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TodoItem } from "./TodoItem";

const fontFamily = "'Noto Sans KR', sans-serif";
const ALL_TEXT = "오늘의 할 일 물 2리터 마시기 30분 산책하기 책 10쪽 읽기 123";

export const MyComposition = () => {
  return (
    <Composition
      id="TodayTodos"
      component={TodayTodos}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Interactive.Div
      name="제목"
      style={{
        fontFamily,
        fontSize: 110,
        fontWeight: 900,
        color: "#1e293b",
        textAlign: "center",
        opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(frame, [0, 0.6 * fps], [0.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          output: "perceptual-scale",
        }),
      }}
    >
      오늘의 할 일 ✅
    </Interactive.Div>
  );
};

export const TodayTodos: React.FC = () => {
  const { fps } = useVideoConfig();
  // Wait until the Korean glyphs used in the video are loaded before rendering frames.
  const [handle] = useState(() => delayRender("Loading Noto Sans KR"));
  useEffect(() => {
    Promise.all([
      document.fonts.load(`700 68px 'Noto Sans KR'`, ALL_TEXT),
      document.fonts.load(`900 110px 'Noto Sans KR'`, ALL_TEXT),
    ]).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff4e6", padding: "0 90px", justifyContent: "center" }}>
      <Sequence name="제목" layout="none">
        <Title />
      </Sequence>
      <div style={{ display: "flex", flexDirection: "column", gap: 60, marginTop: 120 }}>
        <Sequence name="할 일 1" from={Math.round(0.8 * fps)} layout="none">
          <TodoItem number={1} text="물 2리터 마시기" fontFamily={fontFamily} />
        </Sequence>
        <Sequence name="할 일 2" from={Math.round(1.8 * fps)} layout="none">
          <TodoItem number={2} text="30분 산책하기" fontFamily={fontFamily} />
        </Sequence>
        <Sequence name="할 일 3" from={Math.round(2.8 * fps)} layout="none">
          <TodoItem number={3} text="책 10쪽 읽기" fontFamily={fontFamily} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
