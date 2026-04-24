import React from 'react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
}
