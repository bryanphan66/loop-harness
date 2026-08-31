import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Frame } from './brand/Frame.jsx';
import { CARDS } from './brand/Cards.jsx';
import { VIDEOS, LEAD_SEC } from './content.mjs';
import slots from './slots.json';

/**
 * Bộ dựng dùng chung cho cả ba video.
 * Chữ nghĩa lấy từ content.mjs, thời lượng lấy từ slots.json (do build-vo sinh ra).
 * Không có hằng số thời lượng nào nằm cứng trong file này.
 */
export const VideoTemplate = ({ id }) => {
  const { fps } = useVideoConfig();
  const plan = slots.videos[id];
  const content = VIDEOS[id];
  if (!plan) throw new Error(`slots.json chưa có "${id}" — chạy: node scripts/build-vo.mjs`);

  const leadFrames = Math.round(LEAD_SEC * fps);

  return (
    <AbsoluteFill>
      {plan.scenes.map((slot, i) => {
        const scene = content.scenes[i];
        const Card = CARDS[scene.kind];
        return (
          <Sequence
            key={slot.id}
            from={slot.startFrame}
            durationInFrames={slot.frames}
            name={`${slot.id} · ${scene.kind}`}
          >
            <Frame totalFrames={plan.durationInFrames}>
              <Card scene={scene} />
            </Frame>
            <Sequence from={leadFrames} name="vo">
              <Audio src={staticFile(slot.file)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cấu hình composition lấy thẳng từ slots.json — tổng SLOTS luôn khớp durationInFrames. */
export const compositionProps = (id) => {
  const plan = slots.videos[id];
  if (!plan) throw new Error(`slots.json chưa có "${id}" — chạy: node scripts/build-vo.mjs`);
  const sum = plan.scenes.reduce((a, s) => a + s.frames, 0);
  if (sum !== plan.durationInFrames) {
    throw new Error(`SLOTS lệch với durationInFrames ở "${id}": ${sum} != ${plan.durationInFrames}`);
  }
  return { durationInFrames: plan.durationInFrames };
};
