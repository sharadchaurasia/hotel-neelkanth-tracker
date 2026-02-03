import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('daybook_access_requests')
export class DaybookAccessRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'requested_date', type: 'date' })
  requestedDate: string;

  @Column({ default: 'pending' })
  status: string; // pending, approved, denied

  @Column({ nullable: true })
  reason: string;

  @Column({ name: 'admin_note', nullable: true })
  adminNote: string;

  @Column({ name: 'responded_by', nullable: true })
  respondedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt: Date;
}
