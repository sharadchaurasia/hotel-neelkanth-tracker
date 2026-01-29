import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('booking_addons')
export class BookingAddon {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking, (booking) => booking.addOns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ nullable: true })
  type: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;
}
