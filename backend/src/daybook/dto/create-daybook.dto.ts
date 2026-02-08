export class CreateDaybookEntryDto {
  date: string;
  type: string; // 'income' | 'expense'
  category?: string;
  subItem?: string;
  description?: string;
  amount: number;
  paymentSource?: string;
  incomeSource?: string;
  refBookingId?: string;
  guestName?: string;
  paymentMode?: string;
  receivedIn?: string;
  employeeId?: number;
  employeeName?: string;
  linkToAksOffice?: boolean;
  aksSubCategory?: string;
}

export class SetBalanceDto {
  date: string;
  cashOpening: number;
  bankSbiOpening: number;
}
