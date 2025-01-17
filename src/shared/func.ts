import dayjs from 'dayjs';

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
