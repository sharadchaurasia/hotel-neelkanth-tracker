import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { KotItem } from './kot-item.entity';

@Entity('kot_orders')
export class KotOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'kot_id' })
  kotId: string;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: string;

  @Column({ name: 'customer_name', nullable: true })
  customerName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'payment_mode', nullable: true })
  paymentMode: string;

  @Column({ name: 'sub_category', nullable: true })
  subCategory: string;

  @Column({ default: 'PAID' })
  status: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @Column({ name: 'room_no', nullable: true })
  roomNo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'gst_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  gstAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @OneToMany(() => KotItem, item => item.order, { cascade: true, eager: true })
  items: KotItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
