import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { User } from './modules/users/entities/user.entity';
import { Shipment } from './modules/shipments/entities/shipment.entity';
import { Notification } from './modules/notifications/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Shipment, Notification],
      synchronize: true,
      logging: true,
       schema: 'public',
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    I18nModule,
    AuthModule,
    UsersModule,
    ShipmentsModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}