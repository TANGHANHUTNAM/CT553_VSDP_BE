import dayjs from 'dayjs';
import { OTP_LENGTH } from './constant';

export function isInDateRange(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  return dayjs(date).tz().isBetween(startDate, endDate, 'day', '[]');
}

export function generateRandomPassword(length: number): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export function generateRandomCode(length: number): string {
  const charset = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset[randomIndex];
  }
  return code;
}

export function generateOTP(length: number = OTP_LENGTH): string {
  const charset = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    otp += charset[randomIndex];
  }
  return otp;
}

export function generateRandomUuid(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}****@${domain}`;
  }
  const visiblePart = localPart.slice(0, 3);
  return `${visiblePart}****@${domain}`;
}

export function maskPhoneNumber(phone: string | null): string {
  if (!phone) return '';
  if (phone.length <= 7) {
    return phone.slice(0, -3) + '***';
  }
  return phone.slice(0, 7) + '***';
}
