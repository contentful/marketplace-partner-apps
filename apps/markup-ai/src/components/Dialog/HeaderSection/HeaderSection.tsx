import React from 'react';

interface HeaderSectionProps {
  title: string;
  analysisTime: string;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ title, analysisTime }) => (
  <div
    className="dialog-header"
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px 16px 16px 24px',
      gap: 8,
      borderBottom: '1px solid #E7EBEE',
    }}
  >
    {/* TODO: Replace with SVG icon */}
    <div style={{ width: 18, height: 18, background: '#111B2B', borderRadius: '50%' }} />
    <span style={{ fontWeight: 600, fontSize: 16, color: '#111B2B', letterSpacing: -0.32 }}>{title}</span>
    <span style={{ marginLeft: 'auto', color: '#5A657C', fontWeight: 500, fontSize: 12 }}>{analysisTime}</span>
  </div>
);
