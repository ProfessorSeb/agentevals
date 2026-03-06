import { useState } from 'react';
import type { AnnotationQueueItem, Annotation, FirstPassLabel } from '../../lib/types';

interface AnnotationDetailPanelProps {
  item: AnnotationQueueItem;
  onSave: (annotation: Annotation) => void;
  onClose: () => void;
}

export function AnnotationDetailPanel({ item, onSave, onClose }: AnnotationDetailPanelProps) {
  const [firstPass, setFirstPass] = useState<FirstPassLabel | null>(item.annotation?.firstPass ?? null);
  const [comment, setComment] = useState(item.annotation?.comment ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!firstPass) return;
    const annotation: Annotation = {
      firstPass,
      comment,
      annotatedAt: new Date().toISOString(),
    };
    onSave(annotation);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const invocations = item.invocations || [];
  const elements = item.liveElements || [];

  const totalTokens = item.totalTokens ||
    (item.liveStats ? item.liveStats.totalInputTokens + item.liveStats.totalOutputTokens : 0);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, background: 'var(--bg-surface)' }}>
      <div style={{
        flex: '1 1 60%',
        overflowY: 'auto',
        padding: '24px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1.5px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back to table
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#8b5cf6',
            background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px',
            borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {item.model || 'Unknown model'}
          </span>
          {totalTokens > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px',
            }}>
              {totalTokens.toLocaleString()} tokens
            </span>
          )}
          {item.startTime && (
            <span style={{
              fontSize: '11px', color: 'var(--text-tertiary)',
              background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600,
            }}>
              {new Date(item.startTime).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <div style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)',
          marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Session ID
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)',
          marginBottom: '24px',
        }}>
          {item.sessionId}
        </div>

        <div style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)',
          marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Conversation
        </div>

        {invocations.length > 0 ? (
          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px' }}>
            {invocations.map((inv, idx) => (
              <div
                key={inv.invocationId}
                style={{
                  marginBottom: idx < invocations.length - 1 ? '20px' : '0',
                  paddingBottom: idx < invocations.length - 1 ? '20px' : '0',
                  borderBottom: idx < invocations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: '#3b82f6',
                  marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Turn {idx + 1}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>User</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                    {inv.userText || '(no text)'}
                  </div>
                </div>

                {inv.toolCalls.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tool Calls</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {inv.toolCalls.map((tc, i) => (
                        <div key={i} style={{
                          fontSize: '12px', color: '#8b5cf6', fontFamily: 'monospace',
                          background: 'rgba(139, 92, 246, 0.08)', padding: '6px 10px', borderRadius: '6px', fontWeight: 500,
                        }}>
                          {tc.name}({Object.keys(tc.args || {}).length > 0
                            ? Object.keys(tc.args).map(k => `${k}=${JSON.stringify(tc.args[k])}`).join(', ')
                            : ''})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inv.agentText && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Agent</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                      {inv.agentText}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : elements.length > 0 ? (
          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {elements.map((el, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {el.type === 'user_input' ? 'User' : el.type === 'tool_call' ? 'Tool Call' : 'Agent'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: el.type === 'tool_call' ? '#8b5cf6' : 'var(--text-primary)',
                  lineHeight: '1.6',
                  padding: '8px 12px',
                  background: el.type === 'tool_call' ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-surface)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${el.type === 'user_input' ? '#3b82f6' : el.type === 'tool_call' ? '#8b5cf6' : '#10b981'}`,
                  fontFamily: el.type === 'tool_call' ? 'monospace' : 'inherit',
                  fontWeight: el.type === 'tool_call' ? 500 : 400,
                }}>
                  {el.type === 'tool_call'
                    ? `${el.data?.toolCall?.name || 'unknown'}(...)`
                    : el.data?.text || '(no text)'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
            No conversation data available.
          </div>
        )}
      </div>

      <div style={{
        flex: '0 0 340px',
        padding: '24px',
        background: 'var(--bg-surface)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Annotation
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            First Pass
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['looks_correct', 'doesnt_look_correct'] as FirstPassLabel[]).map((val) => {
              const isSelected = firstPass === val;
              const isPositive = val === 'looks_correct';
              return (
                <button
                  key={val}
                  onClick={() => setFirstPass(isSelected ? null : val)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected
                      ? (isPositive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 87, 87, 0.5)')
                      : 'var(--border-default)'}`,
                    background: isSelected
                      ? (isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 87, 87, 0.1)')
                      : 'var(--bg-primary)',
                    fontSize: '22px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {isPositive ? '👍' : '👎'}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Notes
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add optional notes..."
            rows={5}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-default)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={!firstPass}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: firstPass ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              border: 'none',
              color: firstPass ? '#000' : 'var(--text-tertiary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: firstPass ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: firstPass ? '0 0 16px rgba(0, 217, 255, 0.25)' : 'none',
            }}
          >
            Save Annotation
          </button>
          {saved && (
            <span style={{ fontSize: '12px', color: 'var(--status-success)', fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>

        {item.annotation && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current annotation
            </div>
            <div style={{ fontSize: '20px', lineHeight: 1 }}>
              {item.annotation.firstPass === 'looks_correct' ? '👍' : '👎'}
            </div>
            {item.annotation.comment && (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {item.annotation.comment}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
