import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('invoice_counter')
export class InvoiceCounter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'last_number', default: 0 })
  lastNumber: number;
}
