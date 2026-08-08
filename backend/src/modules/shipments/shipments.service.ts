import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';
import * as QRCode from 'qrcode';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private i18nService: I18nService,
  ) {}

  async findAll(): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      relations: {
        sender: true,
        receiver: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findById(id: string): Promise<Shipment | null> {
    return await this.shipmentRepository.findOne({
      where: { id },
      relations: {
        sender: true,
        receiver: true,
      },
    });
  }

  async findByUser(userId: string): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      relations: {
        sender: true,
        receiver: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findBySender(senderId: string): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: { senderId },
      relations: {
        sender: true,
        receiver: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByReceiver(receiverId: string): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: { receiverId },
      relations: {
        sender: true,
        receiver: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private async generateQRCode(trackingCode: string, data: any): Promise<string> {
    try {
      const qrData = JSON.stringify({
        trackingCode: trackingCode,
        senderName: data.senderName,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        weight: data.weight,
        route: data.route,
        createdAt: new Date().toISOString(),
      });

      const qrCode = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 300,
        color: {
          dark: '#0ea5e9',
          light: '#ffffff',
        },
      });

      return qrCode;
    } catch (error) {
      console.error('QR Code oluşturma hatası:', error);
      return null;
    }
  }

  private generateTrackingCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CAR-${year}-${random}`;
  }

  async create(shipmentData: Partial<Shipment>): Promise<Shipment> {
    const receiverPhone = shipmentData.receiverPhone;
    if (!receiverPhone) {
      throw new BadRequestException('Alıcı telefon numarası gerekli');
    }

    let receiver = await this.usersService.findByPhone(receiverPhone);
    if (!receiver) {
      receiver = await this.usersService.createUser(receiverPhone, shipmentData.receiverName || null);
    }

    const sender = await this.usersService.findByPhone('+99365123456');
    if (!sender) {
      throw new BadRequestException('Gönderici bulunamadı');
    }

    const trackingCode = shipmentData.trackingCode || this.generateTrackingCode();
    const qrCode = await this.generateQRCode(trackingCode, {
      senderName: shipmentData.senderName,
      receiverName: shipmentData.receiverName,
      receiverPhone: shipmentData.receiverPhone,
      weight: shipmentData.weight,
      route: shipmentData.route,
    });

    const shipment = this.shipmentRepository.create({
      ...shipmentData,
      trackingCode,
      qrCode,
      senderId: sender.id,
      receiverId: receiver.id,
    });

    const savedShipment = await this.shipmentRepository.save(shipment);

    const userLang = receiver.language || 'tm';
    await this.notificationsService.create(
      receiver.id,
      'newShipment',
      trackingCode,
      userLang,
      savedShipment.id,
    );

    return savedShipment;
  }

  async update(id: string, shipmentData: Partial<Shipment>): Promise<Shipment> {
    const shipment = await this.findById(id);
    if (!shipment) {
      throw new NotFoundException('Kargo bulunamadı');
    }

    if (shipmentData.senderName !== undefined) {
      shipment.senderName = shipmentData.senderName;
    }
    if (shipmentData.receiverName !== undefined) {
      shipment.receiverName = shipmentData.receiverName;
    }
    if (shipmentData.receiverPhone !== undefined) {
      shipment.receiverPhone = shipmentData.receiverPhone;
    }
    if (shipmentData.weight !== undefined) {
      shipment.weight = shipmentData.weight;
    }
    if (shipmentData.price !== undefined) {
      shipment.price = shipmentData.price;
    }
    if (shipmentData.route !== undefined) {
      shipment.route = shipmentData.route;
    }
    if (shipmentData.routeStatus !== undefined) {
      shipment.routeStatus = shipmentData.routeStatus;
    }
    if (shipmentData.currentRouteIndex !== undefined) {
      shipment.currentRouteIndex = shipmentData.currentRouteIndex;
    }
    if (shipmentData.status !== undefined) {
      shipment.status = shipmentData.status;
    }
    if (shipmentData.shippedAt !== undefined) {
      shipment.shippedAt = shipmentData.shippedAt;
    }
    if (shipmentData.deliveredAt !== undefined) {
      shipment.deliveredAt = shipmentData.deliveredAt;
    }

    return await this.shipmentRepository.save(shipment);
  }

  async delete(id: string): Promise<void> {
    const shipment = await this.findById(id);
    if (!shipment) {
      throw new NotFoundException('Kargo bulunamadı');
    }
    await this.shipmentRepository.delete(id);
  }

  async updateRouteStatus(id: string, routeIndex: number, status: boolean): Promise<Shipment> {
    const shipment = await this.findById(id);
    if (!shipment) {
      throw new NotFoundException('Kargo bulunamadı');
    }

    if (routeIndex < 0 || routeIndex >= shipment.route.length) {
      throw new BadRequestException('Geçersiz rota indeksi');
    }

    shipment.routeStatus[routeIndex] = status;
    shipment.currentRouteIndex = routeIndex;

    this.updateShipmentStatus(shipment);

    const savedShipment = await this.shipmentRepository.save(shipment);

    const userLang = 'tm';
    if (savedShipment.status === ShipmentStatus.DELIVERED) {
      await this.notificationsService.create(
        shipment.receiverId,
        'deliveredShipment',
        shipment.trackingCode,
        userLang,
        shipment.id,
      );
    } else if (savedShipment.status === ShipmentStatus.SHIPPED) {
      await this.notificationsService.create(
        shipment.receiverId,
        'shippedShipment',
        shipment.trackingCode,
        userLang,
        shipment.id,
      );
    }

    return savedShipment;
  }

  async toggleRouteStatus(
    id: string,
    routeIndex: number,
    status: boolean,
    fullStatus?: boolean[]
  ): Promise<Shipment> {
    const shipment = await this.findById(id);
    if (!shipment) {
      throw new NotFoundException('Kargo bulunamadı');
    }

    if (routeIndex < 0 || routeIndex >= shipment.route.length) {
      throw new BadRequestException('Geçersiz rota indeksi');
    }

    if (fullStatus && fullStatus.length === shipment.route.length) {
      shipment.routeStatus = fullStatus;
    } else {
      shipment.routeStatus[routeIndex] = status;
    }

    let lastCheckedIndex = -1;
    for (let i = 0; i < shipment.routeStatus.length; i++) {
      if (shipment.routeStatus[i]) {
        lastCheckedIndex = i;
      }
    }
    shipment.currentRouteIndex = lastCheckedIndex;

    this.updateShipmentStatus(shipment);

    const savedShipment = await this.shipmentRepository.save(shipment);

    const userLang = 'tm';
    if (savedShipment.status === ShipmentStatus.DELIVERED) {
      await this.notificationsService.create(
        shipment.receiverId,
        'deliveredShipment',
        shipment.trackingCode,
        userLang,
        shipment.id,
      );
    } else if (savedShipment.status === ShipmentStatus.SHIPPED) {
      await this.notificationsService.create(
        shipment.receiverId,
        'shippedShipment',
        shipment.trackingCode,
        userLang,
        shipment.id,
      );
    }

    return savedShipment;
  }

  private updateShipmentStatus(shipment: Shipment): void {
    const checkedCount = shipment.routeStatus.filter(s => s).length;

    if (checkedCount === 0) {
      shipment.status = ShipmentStatus.LOADED;
    } else if (checkedCount === shipment.route.length) {
      shipment.status = ShipmentStatus.DELIVERED;
      shipment.deliveredAt = new Date();
    } else {
      shipment.status = ShipmentStatus.SHIPPED;
      if (!shipment.shippedAt) {
        shipment.shippedAt = new Date();
      }
    }
  }

  async bulkUpdateRouteStatus(ids: string[], routeIndex: number, status: boolean): Promise<Shipment[]> {
    const updatedShipments: Shipment[] = [];
    for (const id of ids) {
      const shipment = await this.updateRouteStatus(id, routeIndex, status);
      updatedShipments.push(shipment);
    }
    return updatedShipments;
  }

  async getUserStats(userId: string): Promise<{ total: number; inTransit: number; delivered: number }> {
    const shipments = await this.findByUser(userId);
    const total = shipments.length;
    const inTransit = shipments.filter(s => s.status === 'loaded' || s.status === 'shipped').length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    return { total, inTransit, delivered };
  }

  async getPublicStats(): Promise<{
    totalShipments: number;
    completionRate: number;
    activeRoutes: number;
  }> {
    const shipments = await this.findAll();
    const activeShipments = shipments.filter(shipment => shipment.status !== 'delivered');
    const activeRoutes = new Set(
      activeShipments.map(shipment => JSON.stringify(shipment.route || [])),
    ).size;
    const delivered = shipments.filter(shipment => shipment.status === 'delivered').length;

    return {
      totalShipments: shipments.length,
      completionRate: shipments.length ? Math.round((delivered / shipments.length) * 100) : 0,
      activeRoutes,
    };
  }

  async getAdminStats(): Promise<{
    totalShipments: number;
    totalUsers: number;
    totalAdmins: number;
    loaded: number;
    shipped: number;
    delivered: number;
  }> {
    const shipments = await this.findAll();
    const users = await this.usersService.findAll();

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
