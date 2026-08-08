import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment]),
    UsersModule,
    NotificationsModule,  // ← Bunu ekle!
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}