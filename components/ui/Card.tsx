import React from 'react';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-canvas-soft border border-hairline rounded-lg p-5 ${className}`} {...props}>
    {children}
  </div>
);
