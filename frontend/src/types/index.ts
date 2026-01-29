export interface BookingAddon {
  id?: number;
  type: string;
  amount: number;
}

export interface Booking {
  id: number;
  bookingId: string;
  guestName: string;
  phone: string;
  pax: number;
  kot: string;
  roomNo: string;
  noOfRooms: number;
  roomCategory: string;
  checkIn: string;
  checkOut: string;
  mealPlan: string;
  source: string;
  sourceName: string;
  complimentary: string;
  actualRoomRent: number;
  totalAmount: number;
  paymentType: string;
  advanceReceived: number;
  advanceDate: string;
  balanceReceived: number;
  balanceDate: string;
  balancePaymentMode: string;
  paymentMode: string;
  status: string;
  remarks: string;
  kotAmount: number;
  checkedIn: boolean;
  checkedInTime: string;
  checkedOut: boolean;
  checkedOutTime: string;
  rescheduledFrom: string;
  createdAt: string;
  addOns: BookingAddon[];
}

export interface DaybookEntry {
  id: number;
  date: string;
  type: string;
  category: string;
  subItem: string;
  description: string;
  amount: number;
  paymentSource: string;
  incomeSource: string;
  refBookingId: string;
  guestName: string;
  paymentMode: string;
  receivedIn: string;
  employeeId: number;
  employeeName: string;
  createdAt: string;
}

export interface DaybookBalance {
  id?: number;
  date: string;
  cashOpening: number;
  bankSbiOpening: number;
}

export interface Staff {
  id: number;
  staffCode: string;
  name: string;
  designation: string;
  salary: number;
  doj: string;
  status: string;
  lastWorkingDate: string;
  createdAt: string;
}

export interface Attendance {
  id: number;
  staffId: number;
  date: string;
  absent: boolean;
  remark: string;
}

export interface SalaryAdvance {
  id: number;
  staffId: number;
  staff?: Staff;
  amount: number;
  date: string;
  deductMonth: string;
  remarks: string;
  deducted: boolean;
  createdAt: string;
}

export interface DashboardStats {
  checkinGuests: Booking[];
  inhouseGuests: Booking[];
  checkoutGuests: Booking[];
  todayCollectionAmt: number;
  todayCollectedAmt: number;
  todayPendingAmt: number;
  ledgerDueAmt: number;
  ledgerByAgent: Record<string, number>;
}

export const ALL_ROOMS = [
  '101','102','103','104','105',
  '201','202','203','204','205','206',
  '301','302','303','304','305','306',
  '401','402','403',
];

export const ROOM_TYPE: Record<string, string> = {
  '101':'Non-Balcony','102':'Non-Balcony','104':'Non-Balcony','105':'Non-Balcony',
  '201':'Non-Balcony','202':'Non-Balcony','206':'Non-Balcony','303':'Non-Balcony',
  '103':'Balcony','203':'Balcony','204':'Balcony','205':'Balcony',
  '301':'Balcony','302':'Balcony','305':'Balcony','306':'Balcony',
  '304':'Mini Family','401':'Mini Family',
  '402':'Royal Suite Duplex','403':'Royal Suite Duplex',
};

export const EXPENSE_CATEGORIES: Record<string, string[]> = {
  'Grocery': [],
  'Electricity': [],
  'Salary': [],
  'Recharges': [],
  'Deco Items': [],
  'Bakery': [],
  'Housekeeping': ['Napkins/Toilet Rolls','Soap','Shampoo','Lotion','Chemicals','Broom','Mop','Vipers','Slippers','Dental Kits','Room Freshner','Tea','Coffee','Milk','Dusting Pan','Brush','WC Band/Glass Cover','Garbage Bags'],
  'Butchery': [],
  'Fuel': [],
  'Cylinder': [],
  'Laundry': [],
  'Garbage': [],
  'Maintenance': [],
  'Others': [],
};
