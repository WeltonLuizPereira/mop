import React from 'react';

export type NoticeTone = 'info' | 'success' | 'attention' | 'error';

export interface InlineNoticeProps {
  tone: NoticeTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactElement;
}

const TONES: Record<NoticeTone, string> = {
  info: 'border-hairline-2 bg-canvas-soft text-ink-2',
  success: 'border-ok/30 bg-ok/10 text-ink',
  attention: 'border-brand/30 bg-brand-wash text-ink',
  error: 'border-danger/30 bg-danger/10 text-ink',
};

export const InlineNotice = ({ tone, title, children, action }: InlineNoticeProps) => (
  <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 ${TONES[tone]}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 text-sm">
        {title && <div className="mb-0.5 font-semibold text-ink">{title}</div>}
        <div>{children}</div>
      </div>
      {action}
    </div>
  </div>
);
