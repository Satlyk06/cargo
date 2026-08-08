import { Injectable } from '@nestjs/common';

@Injectable()
export class I18nService {
  private translations = {
    tm: {
      notifications: {
        newShipment: 'Täze kargo iberildi! Takip kody: {{trackingCode}}',
        deliveredShipment: 'Kargoňyz eltildi! Takip kody: {{trackingCode}}',
        shippedShipment: 'Kargoňyz ýola çykdy! Takip kody: {{trackingCode}}',
        loadedShipment: 'Kargoňyz ýüklendi! Takip kody: {{trackingCode}}',
      },
    },
    en: {
      notifications: {
        newShipment: 'New shipment sent! Tracking code: {{trackingCode}}',
        deliveredShipment: 'Your shipment delivered! Tracking code: {{trackingCode}}',
        shippedShipment: 'Your shipment shipped! Tracking code: {{trackingCode}}',
        loadedShipment: 'Your shipment loaded! Tracking code: {{trackingCode}}',
      },
    },
    ru: {
      notifications: {
        newShipment: 'Отправлен новый груз! Код отслеживания: {{trackingCode}}',
        deliveredShipment: 'Ваш груз доставлен! Код отслеживания: {{trackingCode}}',
        shippedShipment: 'Ваш груз отправлен! Код отслеживания: {{trackingCode}}',
        loadedShipment: 'Ваш груз загружен! Код отслеживания: {{trackingCode}}',
      },
    },
  };

  translate(key: string, lang: string = 'tm', params?: Record<string, string>): string {
    const langTranslations = this.translations[lang] || this.translations.tm;
    let text = key.split('.').reduce((obj, k) => obj?.[k], langTranslations) || key;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{{${key}}}`, value);
      });
    }
    
    return text;
  }

  getNotificationMessage(type: string, trackingCode: string, lang: string = 'tm'): string {
    const key = `notifications.${type}`;
    return this.translate(key, lang, { trackingCode });
  }
}