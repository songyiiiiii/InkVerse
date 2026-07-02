import React, { useRef, useEffect } from 'react';

export function VRMAvatar({ isThinking = false, isSpeaking = false, height = 320, mode = 'project' }) {
  const h = typeof height === 'number' ? `${height}px` : String(height);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'setState', isThinking, isSpeaking },
        '*'
      );
    }
  }, [isThinking, isSpeaking]);

  return (
    <div style={{
      width: '100%', minWidth: 180, height: h,
      position: 'relative', flexShrink: 0, overflow: 'hidden',
      borderRadius: 14,
    }}>
      <iframe
        ref={iframeRef}
        src={`/vrm-avatar-standalone.html?mode=${mode}`}
        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
        allowTransparency="true"
        title="VRM Avatar"
      />
    </div>
  );
}
