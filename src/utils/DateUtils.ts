export class DateUtils {
  static getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().substring(0, 10);
  }

  static getYesterdayDate(): string {
    return this.getYesterday();
  }

  static getToday(): string {
    return new Date().toISOString().substring(0, 10);
  }

  static formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }

  static parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }
}