import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('attendance')
@Unique(['staffId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'staff_id' })
  staffId: number;

  @ManyToOne(() => Staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: false })
  absent: boolean;

  @Column({ nullable: true })
  remark: string;
}
