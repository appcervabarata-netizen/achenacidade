import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDateIso: string;
  variant?: 'hero' | 'light';
  expiredLabel?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(targetDateIso: string): TimeRemaining {
  const targetMs = new Date(targetDateIso).getTime();
  if (Number.isNaN(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: false };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDateIso,
  variant = 'hero',
  expiredLabel = 'Contagem encerrada · Liberação imediata',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDateIso)
  );

  useEffect(() => {
    setTimeLeft(calculateTimeRemaining(targetDateIso));
    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeRemaining(targetDateIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetDateIso]);

  const pad = (value: number) => String(value).padStart(2, '0');

  const units = [
    { label: 'Dias', value: pad(timeLeft.days) },
    { label: 'Horas', value: pad(timeLeft.hours) },
    { label: 'Minutos', value: pad(timeLeft.minutes) },
    { label: 'Segundos', value: pad(timeLeft.seconds) },
  ];

  const isHero = variant === 'hero';

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {units.map((unit) => (
          <div
            key={unit.label}
            className={`rounded-2xl px-2.5 py-3 sm:px-4 sm:py-4 text-center transition-colors ${
              isHero
                ? 'bg-slate-950/45 border border-white/15 text-white backdrop-blur-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs'
            }`}
          >
            <div
              className={`text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono tabular-nums tracking-tight leading-none ${
                isHero ? 'text-orange-400' : 'text-blue-700 dark:text-blue-400'
              }`}
            >
              {unit.value}
            </div>
            <div
              className={`mt-1.5 text-[11px] sm:text-xs font-medium ${
                isHero ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      {timeLeft.isExpired && (
        <p
          className={`mt-2.5 text-xs font-semibold ${
            isHero ? 'text-orange-300' : 'text-orange-600 dark:text-orange-400'
          }`}
        >
          {expiredLabel}
        </p>
      )}
    </div>
  );
};
