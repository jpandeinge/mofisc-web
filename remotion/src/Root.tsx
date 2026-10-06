import { Composition, Folder } from 'remotion';
import { LandingPageDemo } from './compositions/LandingPageDemo';
import { FeatureShowcase } from './compositions/FeatureShowcase';

// Video dimensions - 16:9 HD
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Landing">
        <Composition
          id="LandingPageDemo"
          component={LandingPageDemo}
          durationInFrames={15 * FPS} // 15 seconds
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{}}
        />
        <Composition
          id="FeatureShowcase"
          component={FeatureShowcase}
          durationInFrames={20 * FPS} // 20 seconds
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{}}
        />
      </Folder>
    </>
  );
};
