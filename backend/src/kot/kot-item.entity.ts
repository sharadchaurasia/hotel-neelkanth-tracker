import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { KotOrder } from './kot-order.entity';

@Entity('kot_items')
export class KotItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => KotOrder, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kot_order_id' })
  order: KotOrder;

  @Column({ name: 'kot_order_id' })
  kotOrderId: number;

  @Column({ name: 'item_name' })
  itemName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;
}
