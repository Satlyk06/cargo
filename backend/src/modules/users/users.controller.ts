import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<User | null> {
    return await this.usersService.findById(id);
  }

  @Post()
  async create(@Body() userData: Partial<User>): Promise<User> {
    return await this.usersService.create(userData);
  }

  @Post('create-user')
  async createUser(
    @Body() body: { phoneNumber: string; name?: string }
  ): Promise<User> {
    return await this.usersService.createUser(body.phoneNumber, body.name);
  }

  @Post('push-token')
  @UseGuards(AuthGuard('jwt'))
  async savePushToken(
    @Req() req: Request & { user: { userId: string } },
    @Body('token') token: string,
  ): Promise<{ success: boolean }> {
    if (!token) {
      throw new BadRequestException('Push token gerekli');
    }

    await this.usersService.updatePushToken(req.user.userId, token);
    return { success: true };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() userData: Partial<User>): Promise<User> {
    return await this.usersService.update(id, userData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }

  @Put(':id/ban')
  async banUser(@Param('id') id: string, @Body('reason') reason: string): Promise<User> {
    return await this.usersService.banUser(id, reason);
  }

  @Put(':id/unban')
  async unbanUser(@Param('id') id: string): Promise<User> {
    return await this.usersService.unbanUser(id);
  }

  @Put(':id/role')
  async changeRole(@Param('id') id: string, @Body('role') role: UserRole): Promise<User> {
    return await this.usersService.changeRole(id, role);
  }
}