import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { C, T, FONT } from './theme.js';
import { CLINIC } from '../content.mjs';
import { Figure } from './Figure.jsx';

/** Trượt lên + hiện dần, dùng cho mọi khối chữ. */
const Rise = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Multiline = ({ text, style }) =>
  text.split('\n').map((line, i) => (
    <div key={i} style={style}>{line}</div>
  ));

// ─── Cảnh mở đầu: câu hỏi bắt người xem dừng lại ────────────────────────────
export const HookCard = ({ scene }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
    <Rise>
      <Multiline
        text={scene.heading}
        style={{ fontSize: T.hook, fontWeight: 700, lineHeight: 1.24, color: C.brandDark }}
      />
    </Rise>
    <Rise delay={8}>
      <div style={{ background: C.card, borderRadius: 40, padding: '26px 20px', border: `3px solid ${C.line}` }}>
        <Figure name={scene.figure} height={430} />
      </div>
    </Rise>
  </div>
);

// ─── Cảnh giới thiệu: nói trước sẽ có mấy động tác ──────────────────────────
export const IntroCard = ({ scene }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
    <Rise>
      <Multiline
        text={scene.heading}
        style={{ fontSize: T.heading, fontWeight: 700, lineHeight: 1.24, color: C.brandDark }}
      />
    </Rise>
    {scene.note && (
      <Rise delay={6}>
        <div style={{ fontSize: T.body, color: C.inkSoft }}>{scene.note}</div>
      </Rise>
    )}
    <Rise delay={10}>
      <div style={{ background: C.card, borderRadius: 40, padding: '20px 16px', border: `3px solid ${C.line}` }}>
        <Figure name={scene.figure} height={360} />
      </div>
    </Rise>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {(scene.chips || []).map((c, i) => (
        <Rise key={c} delay={16 + i * 5}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: C.accentSoft, border: `3px solid ${C.accent}22`,
              borderRadius: 999, padding: '14px 28px',
              fontSize: T.chip, fontWeight: 700, color: C.accent,
            }}
          >
            <span
              style={{
                width: 44, height: 44, borderRadius: 999, background: C.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
              }}
            >
              {i + 1}
            </span>
            {c}
          </div>
        </Rise>
      ))}
    </div>
  </div>
);

// ─── Cảnh động tác ──────────────────────────────────────────────────────────
export const StepCard = ({ scene }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
    <Rise>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            width: 96, height: 96, borderRadius: 28, background: C.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 60, fontWeight: 700,
          }}
        >
          {scene.step}
        </div>
        <div style={{ fontSize: T.heading, fontWeight: 700, lineHeight: 1.18, color: C.brandDark }}>
          {scene.heading}
        </div>
      </div>
    </Rise>

    <Rise delay={7}>
      <div style={{ background: C.card, borderRadius: 40, padding: '20px 16px', border: `3px solid ${C.line}` }}>
        <Figure name={scene.figure} height={400} />
      </div>
    </Rise>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {(scene.lines || []).map((l, i) => (
        <Rise key={l} delay={13 + i * 5}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ width: 16, height: 16, borderRadius: 999, background: C.brand, marginTop: 20 }} />
            <div style={{ fontSize: T.body, lineHeight: 1.36 }}>{l}</div>
          </div>
        </Rise>
      ))}
    </div>

    {scene.meta && (
      <Rise delay={26}>
        <div
          style={{
            alignSelf: 'flex-start', background: C.brand, color: '#fff',
            borderRadius: 20, padding: '16px 30px',
            fontSize: T.meta, fontWeight: 700,
          }}
        >
          {scene.meta}
        </div>
      </Rise>
    )}
  </div>
);

// ─── Thẻ kết: dẫn về việc ĐI KHÁM, không bán gói ────────────────────────────
export const OutroCard = ({ scene }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
    <Rise>
      <div style={{ fontSize: T.heading, fontWeight: 700, lineHeight: 1.2, color: C.brandDark }}>
        {scene.heading}
      </div>
    </Rise>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(scene.bullets || []).map((b, i) => (
        <Rise key={b} delay={7 + i * 6}>
          <div
            style={{
              display: 'flex', gap: 18, alignItems: 'center',
              background: C.accentSoft, borderRadius: 24, padding: '20px 28px',
              fontSize: T.body, fontWeight: 700, color: C.accent,
            }}
          >
            <span style={{ fontSize: 42 }}>•</span>
            {b}
          </div>
        </Rise>
      ))}
    </div>

    <Rise delay={22}>
      <div
        style={{
          background: C.card, border: `3px solid ${C.line}`, borderRadius: 36,
          padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ fontSize: T.meta, fontWeight: 700, color: C.brandDark }}>{CLINIC.name}</div>
        <div style={{ fontSize: 34, lineHeight: 1.34, color: C.ink }}>{CLINIC.address}</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 6 }}>
          {CLINIC.phones.map((p) => (
            <div
              key={p}
              style={{
                background: C.brand, color: '#fff', borderRadius: 18,
                padding: '14px 26px', fontSize: T.meta, fontWeight: 700,
              }}
            >
              {p}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 32, color: C.inkSoft, marginTop: 6 }}>
          {CLINIC.hours}
        </div>
        <div style={{ fontSize: 32, color: C.inkSoft }}>
          {CLINIC.web} · {CLINIC.facebook}
        </div>
      </div>
    </Rise>
  </div>
);

export const CARDS = {
  hook: HookCard,
  intro: IntroCard,
  step: StepCard,
  outro: OutroCard,
};

export { FONT };
