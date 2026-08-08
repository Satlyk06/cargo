import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';  // ← bcrypt import et

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { phoneNumber } });
  }

  // createUser - Kullanıcı oluştur
  async createUser(phoneNumber: string, name?: string): Promise<User> {
    // Kullanıcı var mı kontrol et
    const existing = await this.findByPhone(phoneNumber);
    if (existing) {
      return existing;
    }

    // Son 4 haneyi şifre olarak al
    const last4Digits = phoneNumber.slice(-4);
    const hashedPassword = await bcrypt.hash(last4Digits, 10);

    const user = this.userRepository.create({
      phoneNumber,
      name: name || null,
      password: hashedPassword,
      role: UserRole.USER,
      isBanned: false,
    });

    return await this.userRepository.save(user);
  }

  // create - Partial User ile oluştur
  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    // Sadece name ve isBanned güncellenebilir
    if (userData.name !== undefined) {
      user.name = userData.name;
    }
    if (userData.isBanned !== undefined) {
      user.isBanned = userData.isBanned;
    }
    if (userData.banReason !== undefined) {
      user.banReason = userData.banReason;
    }
    if (userData.bannedAt !== undefined) {
      user.bannedAt = userData.bannedAt;
    }
    return await this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    await this.userRepository.delete(id);
  }

  async banUser(id: string, reason: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    return await this.userRepository.save(user);
  }

  async unbanUser(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    return await this.userRepository.save(user);
  }

  async changeRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    user.role = role;
    return await this.userRepository.save(user);
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    user.pushToken = pushToken;
    await this.userRepository.save(user);
  }

  async updateLanguage(userId: string, language: string): Promise<void> {
    await this.userRepository.update(userId, { language });
  }
}