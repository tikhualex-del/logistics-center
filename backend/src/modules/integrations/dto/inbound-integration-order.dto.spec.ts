import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { InboundIntegrationOrderDto } from './inbound-integration-order.dto';

describe('InboundIntegrationOrderDto', () => {
  it('normalizes inbound order payload values before validation', () => {
    const dto = plainToInstance(InboundIntegrationOrderDto, {
      externalId: '  crm-order-1  ',
      orderNumber: '  ORD-1  ',
      customerName: '  Ivan Petrov  ',
      customerPhone: '+79990000000',
      deliveryAddress: '  Moscow, Tverskaya 1  ',
      deliveryLatitude: '55.7558',
      deliveryLongitude: '37.6173',
      comment: '',
      scheduledDate: '2026-04-20T10:00:00.000Z',
      metadata: {
        source: 'crm',
      },
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto).toEqual(
      expect.objectContaining({
        externalId: 'crm-order-1',
        orderNumber: 'ORD-1',
        customerName: 'Ivan Petrov',
        deliveryAddress: 'Moscow, Tverskaya 1',
        deliveryLatitude: 55.7558,
        deliveryLongitude: 37.6173,
        comment: undefined,
        scheduledDate: new Date('2026-04-20T10:00:00.000Z'),
      }),
    );
  });

  it('rejects missing required integration order fields', () => {
    const dto = plainToInstance(InboundIntegrationOrderDto, {
      externalId: '   ',
      deliveryAddress: '',
    });

    const errors = validateSync(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['externalId', 'deliveryAddress']),
    );
  });

  it('rejects invalid inbound coordinates and phone number', () => {
    const dto = plainToInstance(InboundIntegrationOrderDto, {
      externalId: 'crm-order-1',
      customerPhone: '12345',
      deliveryAddress: 'Moscow, Tverskaya 1',
      deliveryLatitude: '95',
      deliveryLongitude: '-181',
    });

    const errors = validateSync(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'customerPhone',
        'deliveryLatitude',
        'deliveryLongitude',
      ]),
    );
  });
});
