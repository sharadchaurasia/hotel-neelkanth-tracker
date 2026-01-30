import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { BookingAddon } from './booking-addon.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @Column({ name: 'guest_name' })
  guestName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 1 })
  pax: number;

  @Column({ nullable: true })
  kot: string;

  @Column({ name: 'room_no', nullable: true })
  roomNo: string;

  @Column({ name: 'no_of_rooms', default: 1 })
  noOfRooms: number;

  @Column({ name: 'room_category', nullable: true })
  roomCategory: string;

  @Column({ name: 'check_in', type: 'date' })
  checkIn: string;

  @Column({ name: 'check_out', type: 'date' })
  checkOut: string;

  @Column({ name: 'meal_plan', nullable: true })
  mealPlan: string;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_name', nullable: true })
  sourceName: string;

  @Column({ nullable: true })
  complimentary: string;

  @Column({ name: 'actual_room_rent', type: 'decimal', precision: 12, scale: 2, default: 0 })
  actualRoomRent: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'payment_type', nullable: true })
  paymentType: string;

  @Column({ name: 'advance_received', type: 'decimal', precision: 12, scale: 2, default: 0 })
  advanceReceived: number;

  @Column({ name: 'advance_date', type: 'date', nullable: true })
  advanceDate: string;

  @Column({ name: 'balance_received', type: 'decimal', precision: 12, scale: 2, default: 0 })
  balanceReceived: number;

  @Column({ name: 'balance_date', type: 'date', nullable: true })
  balanceDate: string;

  @Column({ name: 'balance_payment_mode', nullable: true })
  balancePaymentMode: string;

  @Column({ name: 'payment_mode', nullable: true })
  paymentMode: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'kot_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  kotAmount: number;

  @Column({ name: 'checked_in', default: false })
  checkedIn: boolean;

  @Column({ name: 'checked_in_time', type: 'timestamp', nullable: true })
  checkedInTime: Date;

  @Column({ name: 'checked_out', default: false })
  checkedOut: boolean;

  @Column({ name: 'checked_out_time', type: 'timestamp', nullable: true })
  checkedOutTime: Date;

  @Column({ name: 'rescheduled_from', nullable: true })
  rescheduledFrom: string;

  @Column({ name: 'last_modified_by', nullable: true })
  lastModifiedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => BookingAddon, (addon) => addon.booking, { cascade: true, eager: true })
  addOns: BookingAddon[];
}
