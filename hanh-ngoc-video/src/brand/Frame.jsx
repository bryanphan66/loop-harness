import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { C, FONT, SAFE, T } from './theme.js';
import { CLINIC, DISCLAIMER } from '../content.mjs';

/**
 * Khung chung của mọi video: nền, thanh thương hiệu, dòng chữ nhỏ bắt buộc,
 * và vạch tiến độ. Ba video dùng chung file này — sửa một chỗ, đổi cả ba.
 */

const Logo = () => (
  <svg width={62} height={62} viewBox="0 0 62 62" role="presentation">
    <circle cx={31} cy={31} r={29} fill={C.brand} />
    <rect x={26} y={14} width={10} height={34} rx={5} fill="#fff" />
    <rect x={14} y={26} width={34} height={10} rx={5} fill="#fff" />
  </svg>
);

export const BrandBar = () => (
  <div
    style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', alignItems: 'center', gap: 22,
      padding: `40px ${SAFE.side}px 0`,
    }}
  >
    <Logo />
    <div style={{ lineHeight: 1.15 }}>
      <div style={{ fontSize: T.brandName, fontWeight: 700, color: C.brandDark }}>
        {CLINIC.name}
      </div>
      <div style={{ fontSize: T.fine, color: C.inkSoft }}>
        {CLINIC.hours}
      </div>
    </div>
  </div>
);

/** Dòng chữ nhỏ bắt buộc — hiện suốt video, không được bỏ. */
export const DisclaimerStrip = () => (
  <div
    style={{
      position: 'absolute', left: 0, right: 0, bottom: 196,
      display: 'flex', justifyContent: 'center',
    }}
  >
    <div
      style={{
        fontFamily: FONT, fontSize: T.fine, color: C.inkSoft,
        background: 'rgba(255,255,255,0.86)',
        border: `2px solid ${C.line}`,
        borderRadius: 999, padding: '12px 30px', letterSpacing: 0.2,
      }}
    >
      {DISCLAIMER}
    </div>
  </div>
);

const Progress = ({ total }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [0, total], [0, 100], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: C.line }}>
      <div style={{ width: `${w}%`, height: '100%', background: C.brand }} />
    </div>
  );
};

export const Frame = ({ children, totalFrames }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        color: C.ink,
        background: `linear-gradient(175deg, ${C.bgTop} 0%, ${C.bgBottom} 100%)`,
      }}
    >
      <Progress total={totalFrames ?? durationInFrames} />
      <BrandBar />
      <AbsoluteFill
        style={{
          padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
      >
        {children}
      </AbsoluteFill>
      <DisclaimerStrip />
    </AbsoluteFill>
  );
};
