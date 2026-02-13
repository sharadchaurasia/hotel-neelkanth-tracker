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
  hotelShare?: number;
  paymentType?: string;
  advanceReceived?: number;
  advanceDate?: string;
  paymentMode?: string;
  paymentSubCategory?: string;
  remarks?: string;
  addOns?: { type: string; amount: number }[];
  collectionAmount?: number;
  agentId?: number;
  collections?: Array<{
    amount: number;
    paymentMode: string;
    type: string;
    subCategory?: string;
    date: string;
  }>;
}

export class CollectPaymentDto {
  // For non-split payment
  amount?: number;
  paymentMode?: string;
  subCategory?: string;

  // For split payment
  splitPayment?: boolean;
  bookingAmount?: number;
  bookingPaymentMode?: string;
  bookingSubCategory?: string;
  kotAmount?: number;
  kotPaymentMode?: string;
}

export class CheckinDto {
  roomNo: string;
  noOfRooms?: number;
}

export class CheckoutDto {
  kotAmount?: number;
  addOns?: { type: string; amount: number }[];
  paymentMode?: string;
  kotPaymentMode?: string;
  subCategory?: string;
  collectAmount?: number;
  transferToAgentLedger?: boolean;
}

export class CancelDto {
  action?: string;
}

export class RescheduleDto {
  newCheckOut: string;
}

export class AgentSettlementDto {
  agentName: string;
  amount: number;
  paymentMode?: string;
  date: string;
  reference?: string;
}

export class RefundDto {
  refundDate: string;
  refundAmount: number;
  refundMode: string;
  deleteDaybookEntry: boolean;
}
