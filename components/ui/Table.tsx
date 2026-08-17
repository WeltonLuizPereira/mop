import React from 'react';

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-hairline rounded-lg overflow-hidden bg-canvas-soft">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-canvas">{children}</table>
    </div>
  </div>
);

Table.Head = ({ children }: { children: React.ReactNode }) => (
  <thead>
    <tr>{children}</tr>
  </thead>
);

Table.Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <th className={`t-eyebrow text-ink-faint text-left px-3.5 py-2.5 border-b border-hairline whitespace-nowrap ${className}`}>
    {children}
  </th>
);

Table.Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-3.5 py-2.5 border-b border-hairline text-[13px] align-middle whitespace-nowrap ${className}`}>
    {children}
  </td>
);
