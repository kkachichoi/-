import { Composition, Folder, Still } from "remotion";
import { MyComposition } from "./Composition";
import { SeaReel } from "./SeaReel";
import { TigerToon } from "./TigerToon";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Folder name="TigerToon">
        <Still
          id="Toon1"
          component={TigerToon}
          width={1080}
          height={1350}
          defaultProps={{
            page: 1,
            crop: { x: 430, y: 140, w: 620, h: 640 },
            narration: "기나긴 겨울 끝, 어느 아침",
            bubbles: [{ text: "...땅 속이 왜 이렇게\n조용하지?", left: 40, top: 730, tail: "right" }],
            caption: "뭔가 수상하다는 표정",
          }}
        />
        <Still
          id="Toon2"
          component={TigerToon}
          width={1080}
          height={1350}
          defaultProps={{
            page: 2,
            crop: { x: 280, y: 590, w: 600, h: 620 },
            sfx: { text: "꾸욱—!", left: 470, top: 60, rotate: -8 },
            bubbles: [{ text: "봄이다!\n다들 일어나!", left: 40, top: 70, size: 80, shout: true, tail: "right" }],
            caption: "앞발로 땅에 봄을 꾹 눌러 넣기",
          }}
        />
        <Still
          id="Toon3"
          component={TigerToon}
          width={1080}
          height={1350}
          defaultProps={{
            page: 3,
            crop: { x: 30, y: 790, w: 600, h: 610 },
            narration: "한편, 땅 속에서는",
            bubbles: [
              { text: "5분만 더...", left: 380, top: 380, tail: "left" },
              { text: "아직 춥단\n말이야~", left: 520, top: 560, tail: "right" },
            ],
            caption: "아무도 안 일어남",
          }}
        />
        <Still
          id="Toon4"
          component={TigerToon}
          width={1080}
          height={1350}
          defaultProps={{
            page: 4,
            crop: { x: 0, y: 160, w: 1122, h: 1170 },
            bubbles: [{ text: "호랑이님 출근하셨다!\n다들 기상~!", left: 330, top: 600, size: 56, tail: "left" }],
            caption: "오늘도 봄 깨우기 완료 🌱",
          }}
        />
      </Folder>
      <Composition
        id="SeaReel"
        component={SeaReel}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
