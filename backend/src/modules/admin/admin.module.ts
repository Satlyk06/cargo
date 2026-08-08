import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [UsersModule, ShipmentsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}