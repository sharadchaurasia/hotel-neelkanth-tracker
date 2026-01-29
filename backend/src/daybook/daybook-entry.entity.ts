import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('daybook_entries')
export class DaybookEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  type: string; // 'income' or 'expense'

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'sub_item', nullable: true })
  subItem: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'payment_source', nullable: true })
  paymentSource: string;

  @Column({ name: 'income_source', nullable: true })
  incomeSource: string;

  @Column({ name: 'ref_booking_id', nullable: true })
  refBookingId: string;

  @Column({ name: 'guest_name', nullable: true })
  guestName: string;

  @Column({ name: 'payment_mode', nullable: true })
  paymentMode: string;

  @Column({ name: 'received_in', nullable: true })
  receivedIn: string;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: number;

  @Column({ name: 'employee_name', nullable: true })
  employeeName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
