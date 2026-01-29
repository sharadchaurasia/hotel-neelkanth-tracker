import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('daybook_balances')
export class DaybookBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ name: 'cash_opening', type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashOpening: number;

  @Column({ name: 'bank_sbi_opening', type: 'decimal', precision: 12, scale: 2, default: 0 })
  bankSbiOpening: number;
}
