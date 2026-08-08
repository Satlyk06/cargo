    import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return await this.adminService.getStats();
  }
}