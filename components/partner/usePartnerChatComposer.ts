'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_FLOOD_INTERVAL_MS, validateChatText } from '@/lib/bridge/chat';
import type { TranslationKey } from '@/lib/i18n';

export function usePartnerChatComposer(props: {
  sendChatMessage: (text: string) => void;
  sendChatTyping: (typing: boolean) => void;
  maxLength: number;
  t: (key: TranslationKey) => string;
}) {
  const { sendChatMessage, sendChatTyping, maxLength, t } = props;
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastSendAt, setLastSendAt] = useState(0);
  const [cooldownProgress, setCooldownProgress] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lastSendAt === 0) return;
    const start = lastSendAt;
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / CHAT_FLOOD_INTERVAL_MS);
      setCooldownProgress(progress);
      if (progress >= 1) clearInterval(intervalId);
    }, 50);
    return () => clearInterval(intervalId);
  }, [lastSendAt]);

  const stopTyping = useCallback(() => {
    sendChatTyping(false);
    if (typingStopRef.current) {
      clearTimeout(typingStopRef.current);
      typingStopRef.current = null;
    }
  }, [sendChatTyping]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length > maxLength) return;
      setInput(value);
      setValidationError(null);
      if (value.trim()) {
        sendChatTyping(true);
        if (typingStopRef.current) clearTimeout(typingStopRef.current);
        typingStopRef.current = setTimeout(stopTyping, 2000);
      } else {
        stopTyping();
      }
    },
    [maxLength, sendChatTyping, stopTyping]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || cooldownProgress < 1) return;
    const { ok, error: err } = validateChatText(trimmed);
    if (!ok) {
      setValidationError(err ?? t('partnerChatInvalid'));
      return;
    }
    setValidationError(null);
    sendChatMessage(trimmed);
    setInput('');
    stopTyping();
    setLastSendAt(Date.now());
    setCooldownProgress(0);
  }, [input, sendChatMessage, stopTyping, t, cooldownProgress]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return {
    input,
    validationError,
    cooldownProgress,
    listRef,
    handleInputChange,
    handleSubmit,
    handleKeyDown,
    stopTyping,
  };
}
