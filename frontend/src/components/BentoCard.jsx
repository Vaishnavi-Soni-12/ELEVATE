import React from 'react';

/**
 * BentoCard: Asymmetric spatial bento container
 */
export default function BentoCard({ children, className = '', style = {} }) {
  return (
    <div className={`bento-card ${className}`} style={style}>
      {children}
    </div>
  );
}
