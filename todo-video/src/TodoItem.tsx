import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  readonly number: number;
  readonly text: string;
  readonly fontFamily: string;
};

// One to-do card. Animates in from its own Sequence start (frame 0 = appearance).
export const TodoItem: React.FC<Props> = ({ number, text, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name={`할 일 ${number}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 40,
        padding: "48px 56px",
        borderRadius: 40,
        backgroundColor: "#ffffff",
        boxShadow: "0 18px 50px rgba(30, 41, 59, 0.12)",
        fontFamily,
        opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0, 0.6 * fps], ["0px 120px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#ff7a59",
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {number}
      </div>
      <div style={{ fontSize: 68, fontWeight: 700, color: "#1e293b", lineHeight: 1.25 }}>
        {text}
      </div>
    </Interactive.Div>
  );
};
