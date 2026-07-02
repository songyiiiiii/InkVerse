import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { VRMAvatar } from './VRMAvatar';

function DotText({ text }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
      {text.replace('...', '')}
      <span style={{ display: 'inline-flex', gap: 1 }}>
        <span style={{ animation: 'dotBounce 0.6s ease-in-out infinite', animationDelay: '0s' }}>.</span>
        <span style={{ animation: 'dotBounce 0.6s ease-in-out infinite', animationDelay: '0.15s' }}>.</span>
        <span style={{ animation: 'dotBounce 0.6s ease-in-out infinite', animationDelay: '0.3s' }}>.</span>
      </span>
    </span>
  );
}

export function TransitionOverlay({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={styles.overlay}
    >
      {/* 光晕 */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      {/* 深色圆形底 */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15,15,26,0.15) 0%, rgba(15,15,26,0.04) 50%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* 中间 VRM */}
      <div style={styles.centerVrm}>
        <VRMAvatar
          mode="transition"
          isThinking={false}
          isSpeaking={false}
          height={560}
        />
      </div>

      {/* 底部文字 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={styles.text}
      >
        <DotText text="正在进入创作空间..." />
      </motion.div>
    </motion.div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#FAFAFA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
    top: '40%',
    left: '35%',
    transform: 'translate(-50%, -50%)',
    animation: 'floatGlow 4s ease-in-out infinite',
  },
  glow2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
    top: '50%',
    left: '55%',
    transform: 'translate(-50%, -50%)',
    animation: 'floatGlow2 5s ease-in-out infinite',
  },
  centerVrm: {
    width: 420,
    height: 560,
    zIndex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  text: {
    position: 'absolute',
    bottom: 80,
    left: '40%',
    transform: 'translateX(-50%)',
    color: '#6366F1',
    fontSize: '2em',
    letterSpacing: '0.08em',
    zIndex: 1,
  },
};
