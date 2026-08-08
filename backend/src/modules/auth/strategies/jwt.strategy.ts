import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // ← false olmalı, süresi dolan token reddedilir
      secretOrKey: process.env.JWT_SECRET || 'benim_gizli_anahtarim_123456',
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      phone: payload.phone, 
      role: payload.role 
    };
  }
}