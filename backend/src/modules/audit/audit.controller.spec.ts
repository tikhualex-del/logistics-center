import { Test, type TestingModule } from '@nestjs/testing';
import { AuditActorRole } from '@prisma/client';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

const mockAuditService = {
  listAuditLogs: jest.fn(),
};

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockAuditService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('returns admin-visible audit logs for the current company', async () => {
    const query = {
      action: 'route.updated',
      limit: 25,
    };
    const serviceResult = [
      {
        id: 'audit-1',
        companyId: 'company-1',
        actorId: 'user-1',
        actorRole: AuditActorRole.admin,
        action: 'route.updated',
        entityType: 'route',
        entityId: 'route-1',
        before: { status: 'draft' },
        after: { status: 'planned' },
        requestId: 'req-1',
        metadata: { source: 'domain-event' },
        createdAt: new Date('2026-04-17T09:00:00.000Z'),
        updatedAt: new Date('2026-04-17T09:00:00.000Z'),
      },
    ];
    mockAuditService.listAuditLogs.mockResolvedValue(serviceResult);

    await expect(controller.listAuditLogs('company-1', query)).resolves.toEqual(
      serviceResult,
    );
    expect(mockAuditService.listAuditLogs).toHaveBeenCalledWith(
      'company-1',
      query,
    );
  });
});
