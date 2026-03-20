import { useCallback, useEffect, useRef, useState } from 'react';
import { MIN_HEIGHT, WIDTH } from './partner-chat-floating-constants';
import { savePartnerChatFloatingPosition } from './partner-chat-floating-position';
import { loadPartnerChatFloatingPosition } from './partner-chat-floating-position';

export function usePartnerChatFloatingDrag() {
  const [pos, setPos] = useState(loadPartnerChatFloatingPosition);
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
      savePartnerChatFloatingPosition(posRef.current.x, posRef.current.y);
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

  return { pos, handlePointerDown };
}
