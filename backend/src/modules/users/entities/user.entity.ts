import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Shipment } from '../../shipments/entities/shipment.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  phoneNumber: string;

  @Column({ nullable: true, length: 100 })
  name: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  banReason: string;

  @Column({ nullable: true })
  bannedAt: Date;

  @Column({ default: 'tm' })
  language: string;

  @Column({ nullable: true })
  pushToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.sender)
  sentShipments: Shipment[];

  @OneToMany(() => Shipment, (shipment) => shipment.receiver)
  receivedShipments: Shipment[];
}