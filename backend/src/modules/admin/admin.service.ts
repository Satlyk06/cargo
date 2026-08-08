import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ShipmentsService } from '../shipments/shipments.service';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private shipmentsService: ShipmentsService,
  ) {}

  async getStats() {
    const users = await this.usersService.findAll();
    const shipments = await this.shipmentsService.findAll();

    return {
      totalShipments: shipments.length,
      totalUsers: users.filter(u => u.role === 'user').length,
      totalAdmins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
      loaded: shipments.filter(s => s.status === 'loaded').length,
      shipped: shipments.filter(s => s.status === 'shipped').length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
    };
  }
}