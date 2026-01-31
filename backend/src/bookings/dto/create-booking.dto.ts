export class CreateBookingDto {
  guestName: string;
  phone?: string;
  pax?: number;
  kot?: string;
  roomNo?: string;
  noOfRooms?: number;
  roomCategory?: string;
  checkIn: string;
  checkOut: string;
  mealPlan?: string;
  source?: string;
  sourceName?: string;
  complimentary?: string;
  addOnAmount?: number;
  actualRoomRent?: number;
  totalAmount: number;
  paymentType?: string;
  advanceReceived?: number;
  paymentMode?: string;
  remarks?: string;
}

export class CollectPaymentDto {
  amount: number;
  paymentMode?: string;
}

export class CheckinDto {
  roomNo: string;
  noOfRooms?: number;
}

export class CheckoutDto {
  kotAmount?: number;
  addOns?: { type: string; amount: number }[];
  paymentMode?: string;
}

export class CancelDto {
  action?: string;
}

export class RescheduleDto {
  newCheckOut: string;
}
