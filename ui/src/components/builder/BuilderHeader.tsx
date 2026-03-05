import React from 'react';
import { css } from '@emotion/react';
import { Button } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { useTraceContext } from '../../context/TraceContext';

interface BuilderHeaderProps {
  onBack: () => void;
  onSave: () => void;
  evalSetId: string;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  onBack,
  onSave,
  evalSetId,
}) => {
  const { state, actions } = useTraceContext();
  const hasQueuedItems = state.annotationQueues.some(q => q.items.length > 0);

  return (
    <div css={headerStyle}>
      <div css={leftSectionStyle}>
        <button css={navButtonStyle} onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div css={titleStyle}>
          <h1>EvalSet Builder</h1>
          <span css={evalSetIdStyle}>{evalSetId}</span>
        </div>
      </div>

      <div css={rightSectionStyle}>
        {hasQueuedItems && (
          <button
            onClick={() => actions.setCurrentView('annotation-queue')}
            css={css`
              display: flex; align-items: center; gap: 8px;
              padding: 8px 14px; border-radius: 6px;
              border: 1px solid rgba(139, 92, 246, 0.4);
              background: transparent; color: #8b5cf6;
              font-size: 0.875rem; font-weight: 500; cursor: pointer;
              transition: all 0.2s ease;
              &:hover { background: rgba(139, 92, 246, 0.08); }
            `}
          >
            Annotation Queues
          </button>
        )}
        <Button
          type="primary"
          icon={<Save size={16} />}
          onClick={onSave}
        >
          Save EvalSet
        </Button>
      </div>
    </div>
  );
};

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
`;

const navButtonStyle = css`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: var(--accent-cyan);
    color: var(--accent-cyan);
    background: var(--bg-elevated);
  }
`;

const leftSectionStyle = css`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const titleStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }
`;

const evalSetIdStyle = css`
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
`;

const rightSectionStyle = css`
  display: flex;
  gap: 12px;
`;
