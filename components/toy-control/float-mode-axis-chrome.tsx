'use client';

export function FloatModeAxisChrome() {
  return (
    <>
      <div className="absolute inset-y-0 left-3 md:left-4 py-6 md:py-8 flex flex-col justify-between text-[10px] text-[var(--app-text-secondary)] font-medium pointer-events-none">
        <span>100%</span>
        <span>0</span>
      </div>

      <div className="absolute inset-y-0 left-10 md:left-12 right-0 flex flex-col justify-between py-6 md:py-8 pointer-events-none opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-px bg-[var(--app-border)]" />
        ))}
      </div>
    </>
  );
}
