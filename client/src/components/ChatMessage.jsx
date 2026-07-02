import React from 'react';

export function ChatMessage({ msg }) {
  if (msg.role === 'system') {
    return (
      <div className="message-enter" style={styles.system}>
        {msg.content}
      </div>
    );
  }

  const isUser = msg.role === 'user';
  return (
    <div className="message-enter" style={{
      ...styles.wrapper,
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      {!isUser && <div style={styles.avatar}>🤖</div>}
      <div style={{
        ...styles.bubble,
        background: isUser ? '#6366f1' : '#1e1e2e',
        color: isUser ? '#fff' : '#d0d0d0',
      }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        {msg.isStreaming && <span className="streaming-cursor" />}
      </div>
      {isUser && <div style={styles.avatar}>✍️</div>}
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', fontSize: '0.8em', flexShrink: 0 },
  bubble: { padding: '10px 16px', borderRadius: 12, maxWidth: '75%', lineHeight: 1.7, fontSize: '0.95em' },
  system: { textAlign: 'center', color: '#666', fontSize: '0.85em', margin: '12px 0', fontStyle: 'italic' },
};
