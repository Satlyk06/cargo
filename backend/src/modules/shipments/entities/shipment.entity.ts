import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ShipmentStatus {
  LOADED = 'loaded',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  senderName: string;

  @Column({ length: 100 })
  receiverName: string;

  @Column({ length: 20 })
  receiverPhone: string;

  @Column('decimal', { precision: 10, scale: 2 })
  weight: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'jsonb', default: [] })
  route: string[];

  @Column({ type: 'jsonb', default: [] })
  routeStatus: boolean[];

  @Column({ default: 0 })
  currentRouteIndex: number;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.LOADED,
  })
  status: ShipmentStatus;

  @Column({ unique: true, length: 50 })
  trackingCode: string;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  shippedAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sentShipments)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => User, (user) => user.receivedShipments)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column()
  receiverId: string;
}