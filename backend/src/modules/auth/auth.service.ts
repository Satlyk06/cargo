import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(phoneNumber: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    
    if (!user) {
      throw new UnauthorizedException('Telefon nomeri tapylmady');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Your account has been banned.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password.');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      phone: user.phoneNumber, 
      role: user.role 
    };
    
    const token = this.jwtService.sign(payload);
    
    // Token süresini logla
    console.log('🔑 Token oluşturuldu');
    console.log('  - Kullanıcı:', user.phoneNumber);
    console.log('  - Rol:', user.role);
    
    // Token'ı decode et ve süreyi göster
    try {
      const decoded = this.jwtService.decode(token) as any;
      console.log('  - Oluşturulma:', new Date(decoded.iat * 1000).toLocaleString());
      console.log('  - Bitiş:', new Date(decoded.exp * 1000).toLocaleString());
      console.log('  - Geçerlilik süresi:', (decoded.exp - decoded.iat) / 86400, 'gün');
    } catch (e) {
      console.log('  - Token decode edilemedi');
    }
    
    return {
      access_token: token,
      expires_in: 2592000, // 30 gün (saniye cinsinden)
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        isBanned: user.isBanned,
      },
    };
  }
}