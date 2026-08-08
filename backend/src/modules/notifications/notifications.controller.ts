import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('user/:userId')
  async findAll(@Param('userId') userId: string) {
    return await this.notificationsService.findAll(userId);
  }

  @Get('user/:userId/unread')
  async findUnread(@Param('userId') userId: string) {
    return await this.notificationsService.findUnread(userId);
  }

  @Get('user/:userId/count')
  async getUnreadCount(@Param('userId') userId: string) {
    return { count: await this.notificationsService.getUnreadCount(userId) };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Body() body: { userId: string }) {
    return await this.notificationsService.markAsRead(id, body.userId);
  }

  @Put('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'Tüm bildirimler okundu' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Body() body: { userId: string }) {
    await this.notificationsService.delete(id, body.userId);
    return { message: 'Bildirim silindi' };
  }

  @Delete('user/:userId/all')
  async deleteAll(@Param('userId') userId: string) {
    await this.notificationsService.deleteAll(userId);
    return { message: 'Tüm bildirimler silindi' };
  }
}