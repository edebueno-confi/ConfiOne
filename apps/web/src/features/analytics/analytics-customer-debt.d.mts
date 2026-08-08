export type DebtPriority = 'alta' | 'media' | 'baixa';

export interface DebtTicket {
  ticketId: string;
  pipelineLabel: string;
  daysSilent: number;
  ownerName: string;
}

export interface DebtCompany {
  companyId: string;
  name: string;
  tickets: number;
  oldestDaysSilent: number;
  avgDaysSilent: number;
  inWorkedQueue: number;
  priority: DebtPriority;
  details: DebtTicket[];
}

export interface CustomerDebtReading {
  available: boolean;
  threshold: number | null;
  totalTickets: number;
  totalCompanies: number;
  companies: DebtCompany[];
  highPriority: number;
  inWorkedQueue: number;
}

export declare const PRIORITY_LABELS: Record<DebtPriority, string>;
export declare function debtPriority(company: Partial<DebtCompany> | null): DebtPriority;
export declare function humanizeSilence(days: number): string;
export declare function readCustomerDebt(payload: unknown): CustomerDebtReading;
export declare function toDebtRows(reading: CustomerDebtReading): Array<Record<string, string | number>>;
export declare function toDebtCsv(reading: CustomerDebtReading): string;
