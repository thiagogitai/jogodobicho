export class DateUtils {
  static getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    return dateStr || new Date().toISOString().split('T')[0];
  }

  static getToday(): string {
    const dateStr = new Date().toISOString().split('T')[0];
    return dateStr || new Date().toISOString().split('T')[0];
  }

  static formatDate(date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr || new Date().toISOString().split('T')[0];
  }

  static parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }
}