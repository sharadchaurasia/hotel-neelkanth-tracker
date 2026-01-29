import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('salary_advances')
export class SalaryAdvance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'staff_id' })
  staffId: number;

  @ManyToOne(() => Staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'deduct_month', nullable: true })
  deductMonth: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  deducted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
