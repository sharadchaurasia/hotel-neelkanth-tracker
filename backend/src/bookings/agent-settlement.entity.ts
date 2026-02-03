import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('agent_settlements')
export class AgentSettlement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'agent_name' })
  agentName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'payment_mode', nullable: true })
  paymentMode: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
