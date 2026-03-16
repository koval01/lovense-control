'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BridgeChatMessage } from '@/hooks/use-bridge-session';
import type { TranslationKey } from '@/lib/i18n';
import { PartnerChatContent } from './PartnerChatContent';

const FLOATING_STORAGE_KEY = 'partner-chat-floating-position';
const DEFAULT_X = 24;
const DEFAULT_Y = 24;
const WIDTH = 380;
const MIN_HEIGHT = 280;
const MAX_HEIGHT = 520;
const HEIGHT = 420;

export interface PartnerChatFloatingProps {
  chatMessages: BridgeChatMessage[];
  partnerTyping: boolean;
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void;
  maxLength?: number;
  connectionOk?: boolean;
  t: (key: TranslationKey) => string;
}

function loadPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: DEFAULT_X, y: DEFAULT_Y };
  const margin = 16;
  try {
    const raw = localStorage.getItem(FLOATING_STORAGE_KEY);
    if (!raw) {
      return {
        x: window.innerWidth - WIDTH - margin,
        y: window.innerHeight - HEIGHT - margin,
      };
    }
    const { x, y } = JSON.parse(raw);
    if (typeof x === 'number' && typeof y === 'number') {
      const xClamp = Math.max(margin, Math.min(window.innerWidth - WIDTH - margin, x));
      const yClamp = Math.max(margin, Math.min(window.innerHeight - MIN_HEIGHT - margin, y));
      return { x: xClamp, y: yClamp };
    }
  } catch {
    // ignore
  }
  return {
    x: window.innerWidth - WIDTH - margin,
    y: window.innerHeight - HEIGHT - margin,
  };
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(FLOATING_STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {
    // ignore
  }
}

/**
 * Desktop-only: always-visible chat as a draggable floating window.
 */
export function PartnerChatFloating({
  chatMessages,
  partnerTyping,
  sendChatMessage,
  sendChatTyping,
  sendChatVoice,
  maxLength,
  connectionOk,
  t,
}: PartnerChatFloatingProps) {
  const [pos, setPos] = useState(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, textarea, input')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: pos.x,
      top: pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos.x, pos.y]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const margin = 16;
      const newX = Math.max(margin, Math.min(window.innerWidth - WIDTH - margin, dragStartRef.current.left + dx));
      const newY = Math.max(margin, Math.min(window.innerHeight - MIN_HEIGHT - margin, dragStartRef.current.top + dy));
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      setIsDragging(false);
      savePosition(posRef.current.x, posRef.current.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  return (
    <div
      className="fixed z-50 flex flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] overflow-hidden select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: WIDTH,
        height: HEIGHT,
        minHeight: MIN_HEIGHT,
        maxHeight: Math.min(MAX_HEIGHT, typeof window !== 'undefined' ? window.innerHeight - pos.y - 16 : MAX_HEIGHT),
      }}
      role="complementary"
      aria-label={t('partnerChatTitle')}
    >
      <div
        className="shrink-0 flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-2 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
      >
        <span className="text-sm font-semibold text-[var(--app-text-primary)] flex items-center gap-1.5">
          <span className="text-[var(--app-text-secondary)]">💬</span>
          {t('partnerChatTitle')}
        </span>
      </div>
      <PartnerChatContent
        chatMessages={chatMessages}
        partnerTyping={partnerTyping}
        sendChatMessage={sendChatMessage}
        sendChatTyping={sendChatTyping}
        sendChatVoice={sendChatVoice}
        maxLength={maxLength}
        connectionOk={connectionOk}
        t={t}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
