import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DispatchersService } from './dispatchers.service';

const mockPrismaService = {
  dispatcher: {
    findMany: jest.fn(),
  },
  runWithTenant: jest.fn(),
};

const baseDispatcher = {
  id: 'dispatcher-1',
  company_id: 'company-1',
  user_id: 'user-1',
  is_active: true,
  created_at: new Date('2026-04-30T10:00:00.000Z'),
  updated_at: new Date('2026-04-30T11:00:00.000Z'),
  user: {
    id: 'user-1',
    email: 'dispatcher@example.com',
    phone: '+79990000000',
    first_name: 'Anna',
    last_name: 'Ivanova',
    is_active: true,
  },
};

describe('DispatchersService', () => {
  let service: DispatchersService;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DispatchersService>(DispatchersService);
  });

  it('lists active tenant dispatchers for assignment dropdowns', async () => {
    mockPrismaService.dispatcher.findMany.mockResolvedValue([baseDispatcher]);

    const result = await service.listDispatchers('company-1');

    expect(mockPrismaService.runWithTenant).toHaveBeenCalledWith(
      'company-1',
      expect.any(Function),
    );
    expect(mockPrismaService.dispatcher.findMany).toHaveBeenCalledWith({
      where: {
        is_active: true,
        user: {
          is: {
            is_active: true,
            role: UserRole.dispatcher,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      select: expect.any(Object),
    });
    expect(result).toEqual([
      {
        id: 'dispatcher-1',
        companyId: 'company-1',
        userId: 'user-1',
        email: 'dispatcher@example.com',
        phone: '+79990000000',
        firstName: 'Anna',
        lastName: 'Ivanova',
        isActive: true,
        createdAt: baseDispatcher.created_at,
        updatedAt: baseDispatcher.updated_at,
      },
    ]);
  });
});
