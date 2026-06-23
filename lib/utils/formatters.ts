import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date: string | Date | null | undefined, fmt = 'yyyy.MM.dd'): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt, { locale: ko });
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'yyyy.MM.dd HH:mm');
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function formatBizRegNo(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
}

export function getPensionTypeLabel(type: 'DB' | 'DC'): string {
  return type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)';
}

export function getStatusLabel(status: string): string {
  return status;
}
