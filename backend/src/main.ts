import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './modules/users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS - allow all origins for mobile app
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api');
  
  // Default admin oluştur
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);
  
  const adminExists = await userRepo.findOne({
    where: { phoneNumber: '+99365123456' }
  });
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepo.create({
      phoneNumber: '+99365123456',
      name: 'System Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isBanned: false,
    });
    await userRepo.save(admin);
    console.log('✅ Default admin döredildi!');
    console.log('📱 Telefon: +99365123456');
    console.log('🔑 Parol: admin123');
  } else {
    console.log('ℹ️ Admin bar');
  }
  
  await app.listen(3001, '0.0.0.0');
  console.log(`🚀 Backend işleýär: http://localhost:3001`);
  console.log(`📊 PostgreSQL: CargoDB`);
}
bootstrap();