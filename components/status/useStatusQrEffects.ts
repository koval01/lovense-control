import { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

const QR_SIZE = 240;

export function useStatusQrEffects(qrUrl: string | null, qrCode: string | null | undefined) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageLoaded(false);
    if (!qrUrl || qrCode) return;

    const preloader = new window.Image();
    preloader.referrerPolicy = 'no-referrer';
    preloader.onload = () => setImageLoaded(true);
    preloader.onerror = () => setImageLoaded(false);
    preloader.src = qrUrl;
  }, [qrUrl, qrCode]);

  useEffect(() => {
    setQrReady(false);
    if (!qrCode || typeof qrCode !== 'string' || !qrContainerRef.current) return;

    const container = qrContainerRef.current;
    const qr = new QRCodeStyling({
      width: QR_SIZE,
      height: QR_SIZE,
      type: 'svg',
      data: qrCode,
      margin: 4,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { type: 'square', color: '#000000' },
      cornersSquareOptions: { type: 'square', color: '#000000' },
      cornersDotOptions: { type: 'square', color: '#000000' },
      backgroundOptions: { color: '#ffffff' },
    });
    qr.append(container);
    setQrReady(true);

    return () => {
      container.innerHTML = '';
    };
  }, [qrCode]);

  return { imageLoaded, qrReady, qrContainerRef, qrSize: QR_SIZE };
}
