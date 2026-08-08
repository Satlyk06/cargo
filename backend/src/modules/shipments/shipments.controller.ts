import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './entities/shipment.entity';

@Controller('shipments')
export class ShipmentsController {
  constructor(private shipmentsService: ShipmentsService) {}

  @Get()
  async findAll(): Promise<Shipment[]> {
    return await this.shipmentsService.findAll();
  }

  @Get('public-stats')
  async getPublicStats() {
    return await this.shipmentsService.getPublicStats();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Shipment | null> {
    return await this.shipmentsService.findById(id);
  }

  @Post()
  async create(@Body() shipmentData: Partial<Shipment>): Promise<Shipment> {
    return await this.shipmentsService.create(shipmentData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() shipmentData: Partial<Shipment>): Promise<Shipment> {
    return await this.shipmentsService.update(id, shipmentData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.shipmentsService.delete(id);
  }

  // ✅ Kullanıcının tüm kargoları (gönderen + alıcı)
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string): Promise<Shipment[]> {
    return await this.shipmentsService.findByUser(userId);
  }

  // ✅ Sadece gönderenin kargoları
  @Get('sender/:senderId')
  async findBySender(@Param('senderId') senderId: string): Promise<Shipment[]> {
    return await this.shipmentsService.findBySender(senderId);
  }

  // ✅ Sadece alıcının kargoları
  @Get('receiver/:receiverId')
  async findByReceiver(@Param('receiverId') receiverId: string): Promise<Shipment[]> {
    return await this.shipmentsService.findByReceiver(receiverId);
  }

  @Patch(':id/route/:index')
  async updateRouteStatus(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: { status: boolean }
  ): Promise<Shipment> {
    return await this.shipmentsService.updateRouteStatus(
      id, 
      parseInt(index), 
      body.status
    );
  }

  @Patch(':id/route/:index/toggle')
  async toggleRouteStatus(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: { status: boolean; fullStatus?: boolean[] }
  ): Promise<Shipment> {
    return await this.shipmentsService.toggleRouteStatus(
      id, 
      parseInt(index),
      body.status,
      body.fullStatus
    );
  }

  @Post('bulk/route')
  async bulkUpdateRouteStatus(
    @Body() body: { ids: string[]; routeIndex: number; status: boolean }
  ): Promise<Shipment[]> {
    return await this.shipmentsService.bulkUpdateRouteStatus(
      body.ids, 
      body.routeIndex, 
      body.status
    );
  }
}
