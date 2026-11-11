import React from "react";
import { Composition } from "remotion";
import { KkachiShort } from "./KkachiShort";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="KkachiCafe"
    component={KkachiShort}
    durationInFrames={timeline.durationInFrames}
    fps={timeline.fps}
    width={1080}
    height={1920}
  />
);
