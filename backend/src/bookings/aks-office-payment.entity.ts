import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('aks_office_payments')
export class AksOfficePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'ref_booking_id', nullable: true })
  refBookingId: string;

  @Column({ name: 'guest_name' })
  guestName: string;

  @Column({ name: 'room_no', nullable: true })
  roomNo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'sub_category', nullable: true })
  subCategory: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  context: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
