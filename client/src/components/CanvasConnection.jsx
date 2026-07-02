import React from 'react';

export function CanvasConnection({ x1, y1, x2, y2 }) {
  const midX = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

  return (
    <path
      d={d}
      stroke="#D0D0D0"
      strokeWidth={1.5}
      fill="none"
      strokeDasharray="6 3"
      style={{ opacity: 0.6 }}
    />
  );
}
