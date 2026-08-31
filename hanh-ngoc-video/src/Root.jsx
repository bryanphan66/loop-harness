import React from 'react';
import { Composition } from 'remotion';
import { DauLung } from './DauLung.jsx';
import { TaiBien } from './TaiBien.jsx';
import { CoVaiGay } from './CoVaiGay.jsx';
import { compositionProps } from './VideoTemplate.jsx';
import { FPS, WIDTH, HEIGHT } from './content.mjs';

// durationInFrames đọc từ slots.json — không hằng số cứng, không lệch với lời đọc.
const COMPS = [
  { id: 'DauLung', component: DauLung },
  { id: 'TaiBien', component: TaiBien },
  { id: 'CoVaiGay', component: CoVaiGay },
];

export const RemotionRoot = () => (
  <>
    {COMPS.map(({ id, component }) => (
      <Composition
        key={id}
        id={id}
        component={component}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        {...compositionProps(id)}
      />
    ))}
  </>
);
