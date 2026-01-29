import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'staff_code', nullable: true })
  staffCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  salary: number;

  @Column({ type: 'date', nullable: true })
  doj: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'last_working_date', type: 'date', nullable: true })
  lastWorkingDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
