import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { SeaReel } from "./SeaReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
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
