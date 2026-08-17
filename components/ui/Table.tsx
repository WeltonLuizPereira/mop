import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  label: string;
  toolbar?: React.ReactNode;
  containerClassName?: string;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  onActivate?: () => void;
  activationLabel?: string;
  selected?: boolean;
}

const Head = ({ children }: { children: React.ReactNode }) => <thead><tr>{children}</tr></thead>;
const Body = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;

const Row = ({
  onActivate,
  activationLabel,
  selected = false,
  onKeyDown,
  className = '',
  children,
  ...props
}: TableRowProps) => (
  <tr
    {...props}
    tabIndex={0}
    aria-label={activationLabel}
    aria-selected={selected}
    className={`${onActivate ? 'cursor-pointer hover:bg-canvas-soft' : ''} ${className}`}
    onClick={event => {
      props.onClick?.(event);
      if (!event.defaultPrevented) onActivate?.();
    }}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && onActivate && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onActivate();
      }
    }}
  >
    {children}
  </tr>
);

const Th = ({ children, className = '', scope = 'col', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th {...props} scope={scope} className={`t-eyebrow text-ink-faint text-left px-3.5 py-2.5 border-b border-hairline whitespace-nowrap ${className}`}>
    {children}
  </th>
);

const Td = ({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...props} className={`px-3.5 py-2.5 border-b border-hairline text-[13px] align-middle whitespace-nowrap ${className}`}>
    {children}
  </td>
);

type TableComponent = React.FC<TableProps> & {
  Head: typeof Head;
  Body: typeof Body;
  Row: typeof Row;
  Th: typeof Th;
  Td: typeof Td;
};

export const Table: TableComponent = ({
  label,
  toolbar,
  containerClassName = '',
  className = '',
  children,
  ...props
}) => (
  <div className="border border-hairline rounded-lg overflow-hidden bg-canvas-soft">
    {toolbar && <div className="border-b border-hairline">{toolbar}</div>}
    <div role="region" aria-label={label} tabIndex={0} className={`overflow-x-auto ${containerClassName}`}>
      <table {...props} className={`w-full border-collapse bg-canvas ${className}`}>{children}</table>
    </div>
  </div>
);

Table.Head = Head;
Table.Body = Body;
Table.Row = Row;
Table.Th = Th;
Table.Td = Td;
