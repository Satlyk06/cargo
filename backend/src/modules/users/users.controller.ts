import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  private async getActor(req: Request & { user: { userId: string } }): Promise<User> {
    const actor = await this.usersService.findById(req.user.userId);
    if (!actor) throw new NotFoundException('Kullanıcı bulunamadı');
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Bu işlem için yönetici yetkisi gerekli');
    }
    return actor;
  }

  private async assertCanManageTarget(
    req: Request & { user: { userId: string } },
    targetId: string,
  ): Promise<User> {
    const [actor, target] = await Promise.all([
      this.getActor(req),
      this.usersService.findById(targetId),
    ]);
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin hesabı yönetilemez');
    }
    if (actor.role === UserRole.ADMIN && target.role !== UserRole.USER) {
      throw new ForbiddenException('Adminler yalnızca kullanıcı hesaplarını yönetebilir');
    }
    return actor;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: Request & { user: { userId: string } }): Promise<User[]> {
    await this.getActor(req);
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<User | null> {
    return await this.usersService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: Request & { user: { userId: string } }, @Body() userData: Partial<User>): Promise<User> {
    const actor = await this.getActor(req);
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Kullanıcı oluşturma yalnızca super admin yetkisindedir');
    }
    if (userData.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin rolü atanamaz');
    }
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
  @UseGuards(AuthGuard('jwt'))
  async update(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string, @Body() userData: Partial<User>): Promise<User> {
    if (req.user.userId === id) {
      return await this.usersService.update(id, { name: userData.name });
    }
    await this.assertCanManageTarget(req, id);
    return await this.usersService.update(id, userData);
  }

  @Put(':id/password')
  @UseGuards(AuthGuard('jwt'))
  async changeOwnPassword(
    @Req() req: Request & { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ): Promise<{ success: boolean }> {
    if (req.user.userId !== id) {
      throw new ForbiddenException('Yalnızca kendi parolanızı değiştirebilirsiniz');
    }
    await this.usersService.changeOwnPassword(id, body.currentPassword, body.newPassword);
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string): Promise<void> {
    await this.assertCanManageTarget(req, id);
    await this.usersService.delete(id);
  }

  @Put(':id/ban')
  @UseGuards(AuthGuard('jwt'))
  async banUser(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string, @Body('reason') reason: string): Promise<User> {
    await this.assertCanManageTarget(req, id);
    return await this.usersService.banUser(id, reason);
  }

  @Put(':id/unban')
  @UseGuards(AuthGuard('jwt'))
  async unbanUser(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string): Promise<User> {
    await this.assertCanManageTarget(req, id);
    return await this.usersService.unbanUser(id);
  }

  @Put(':id/role')
  @UseGuards(AuthGuard('jwt'))
  async changeRole(@Req() req: Request & { user: { userId: string } }, @Param('id') id: string, @Body('role') role: UserRole): Promise<User> {
    const actor = await this.assertCanManageTarget(req, id);
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Rol değiştirme yalnızca super admin yetkisindedir');
    }
    if (role !== UserRole.USER && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bu rol atanamaz');
    }
    return await this.usersService.changeRole(id, role);
  }
}
