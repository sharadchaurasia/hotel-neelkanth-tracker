import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @Column({ name: 'payment_mode' })
  paymentMode: string;

  @Column({ name: 'sub_category', nullable: true })
  subCategory: string;

  @Column({ default: 'PAID' })
  status: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
