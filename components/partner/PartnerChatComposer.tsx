'use client';

import { Icon28VoiceOutline } from '@vkontakte/icons';
import { WriteBar, WriteBarIcon } from '@vkontakte/vkui';
import type { TranslationKey } from '@/lib/i18n';
import type { usePartnerChatComposer } from '@/components/partner/usePartnerChatComposer';

type Composer = ReturnType<typeof usePartnerChatComposer>;

export function PartnerChatComposer(props: {
  connectionOk: boolean;
  maxLength: number;
  onInputBlur?: () => void;
  t: (key: TranslationKey) => string;
  composer: Composer;
  isRecording: boolean;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
}) {
  const {
    connectionOk,
    maxLength,
    onInputBlur,
    t,
    composer,
    isRecording,
    onVoiceStart,
    onVoiceStop,
  } = props;
  const { input, validationError, cooldownProgress, handleInputChange, handleSubmit, handleKeyDown } =
    composer;
  return (
    <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col gap-2 backdrop-blur-md shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.25)]">
      {!connectionOk ? (
        <p className="text-sm text-[var(--app-text-secondary)]" role="status">
          {t('partnerChatUnavailable')}
        </p>
      ) : (
        <>
          <WriteBar
            className="rounded-2xl"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={onInputBlur}
            placeholder={t('partnerChatPlaceholder')}
            maxLength={maxLength}
            rows={1}
            shadow
            slotProps={{ textArea: { className: '!rounded-2xl' } }}
            before={
              <WriteBarIcon
                onClick={isRecording ? onVoiceStop : onVoiceStart}
                label={isRecording ? t('partnerChatVoiceStop') : t('partnerChatVoiceStart')}
                className={isRecording ? '!bg-red-500 !text-white' : ''}
              >
                <Icon28VoiceOutline />
              </WriteBarIcon>
            }
            after={
              <WriteBarIcon
                mode="send"
                onClick={handleSubmit}
                disabled={!input.trim() || cooldownProgress < 1}
                label={t('partnerChatSend')}
                aria-busy={cooldownProgress < 1}
              />
            }
          />
          <div className="flex justify-between items-center min-h-[20px]">
            <span className="text-xs text-[var(--app-text-secondary)]">
              {input.length} / {maxLength}
            </span>
            {validationError && (
              <span className="text-xs text-red-500" role="alert">
                {validationError}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
