import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ledger_opening_balance')
export class LedgerOpeningBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'agent_name', length: 100 })
  agentName: string;

  @Column({ length: 7 })
  month: string; // Format: 'YYYY-MM' (e.g., '2026-02')

  @Column({ name: 'opening_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
