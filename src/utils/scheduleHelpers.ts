import { DaySchedule } from '../types';

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: 'Segunda-feira', shortDay: 'Seg', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Terça-feira', shortDay: 'Ter', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Quarta-feira', shortDay: 'Qua', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Quinta-feira', shortDay: 'Qui', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Sexta-feira', shortDay: 'Sex', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { day: 'Sábado', shortDay: 'Sáb', isOpen: true, openTime: '08:00', closeTime: '13:00' },
  { day: 'Domingo', shortDay: 'Dom', isOpen: false, openTime: '09:00', closeTime: '13:00' },
];

export function cloneWeeklySchedule(existing?: DaySchedule[]): DaySchedule[] {
  if (existing && existing.length === 7) {
    return existing.map((item) => ({ ...item }));
  }
  return DEFAULT_WEEKLY_SCHEDULE.map((item) => ({ ...item }));
}

export function compileWeeklyScheduleSummary(schedule: DaySchedule[]): string {
  const openDays = schedule.filter((s) => s.isOpen);
  if (openDays.length === 0) return 'Temporariamente Fechado';

  if (openDays.length === 7) {
    const first = openDays[0];
    const allSame = openDays.every(
      (d) => d.openTime === first.openTime && d.closeTime === first.closeTime
    );
    if (allSame) return `Todos os dias: ${first.openTime} às ${first.closeTime}`;
  }

  const segSex = schedule.slice(0, 5);
  const sab = schedule[5];
  const dom = schedule[6];
  const segSexAllOpen = segSex.every((d) => d.isOpen);
  const segSexSameTime =
    segSexAllOpen &&
    segSex.every(
      (d) => d.openTime === segSex[0].openTime && d.closeTime === segSex[0].closeTime
    );

  if (segSexSameTime) {
    let str = `Seg a Sex: ${segSex[0].openTime} às ${segSex[0].closeTime}`;
    if (sab?.isOpen) str += ` | Sáb: ${sab.openTime} às ${sab.closeTime}`;
    else str += ' | Sáb: Fechado';
    if (dom?.isOpen) str += ` | Dom: ${dom.openTime} às ${dom.closeTime}`;
    return str;
  }

  return openDays
    .map((d) => `${d.shortDay}: ${d.openTime}-${d.closeTime}`)
    .join(' | ');
}
