import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { I18nService } from '../i18n/i18n.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private i18nService: I18nService,
    private usersService: UsersService,
  ) {}

  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user?.pushToken) {
      return;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.pushToken,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high',
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Push bildirimi gönderilemedi:', response.status, responseText);
      }
    } catch (error) {
      console.error('Push bildirimi gönderilirken hata oluştu:', error);
    }
  }

  async create(
    userId: string,
    type: string,
    trackingCode: string,
    lang: string = 'tm',
    shipmentId?: string,
  ): Promise<Notification> {
    const message = this.i18nService.getNotificationMessage(type, trackingCode, lang);

    const notification = this.notificationRepository.create({
      userId,
      message,
      shipmentId,
      isRead: false,
      isDeleted: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    await this.sendPushNotification(
      userId,
      'Cargo',
      message,
      {
        type,
        trackingCode,
        notificationId: savedNotification.id,
        shipmentId,
      },
    );

    return savedNotification;
  }

  async findAll(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: {
        userId,
        isDeleted: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId, isDeleted: false },
    });
    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı');
    }
    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false, isDeleted: false },
      { isRead: true }
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı');
    }
    notification.isDeleted = true;
    await this.notificationRepository.save(notification);
  }

  async deleteAll(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isDeleted: false },
      { isDeleted: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false, isDeleted: false },
    });
  }
}