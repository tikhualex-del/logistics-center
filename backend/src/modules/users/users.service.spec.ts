import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { CourierStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const prismaTx = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  courier: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  dispatcher: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
};

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  runWithTenant: jest.fn(),
  $transaction: jest.fn(),
};

const baseUser = {
  id: 'user-1',
  company_id: 'company-1',
  role: UserRole.admin,
  email: 'admin@example.com',
  phone: null,
  first_name: 'Ivan',
  last_name: 'Petrov',
  is_active: true,
  last_login_at: null,
  created_at: new Date('2026-04-16T10:00:00.000Z'),
  updated_at: new Date('2026-04-16T10:00:00.000Z'),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.runWithTenant.mockImplementation(
      async (_companyId: string, callback: () => Promise<unknown>) =>
        await callback(),
    );
    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaTx) => Promise<unknown>) =>
        await callback(prismaTx),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('returns current user profile within tenant scope', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(baseUser);

    const result = await service.getMe(baseUser.id, baseUser.company_id);

    expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      select: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: baseUser.id,
        companyId: baseUser.company_id,
        role: baseUser.role,
        email: baseUser.email,
      }),
    );
  });

  it('lists tenant users ordered through PrismaService', async () => {
    mockPrismaService.user.findMany.mockResolvedValue([baseUser]);

    const result = await service.listUsers(baseUser.company_id);

    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: 'desc' },
      select: expect.any(Object),
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.email).toBe(baseUser.email);
  });

  it('creates a courier user, hashes password, and creates courier profile', async () => {
    prismaTx.user.findFirst.mockResolvedValue(null);
    prismaTx.user.create.mockImplementation(async ({ data }) => ({
      ...baseUser,
      id: 'user-2',
      role: UserRole.courier,
      email: data.email as string,
      phone: (data.phone as string | null | undefined) ?? null,
      first_name: data.first_name as string,
      last_name: (data.last_name as string | null | undefined) ?? null,
      is_active: data.is_active as boolean,
    }));
    prismaTx.courier.upsert.mockResolvedValue({});

    const result = await service.createUser(baseUser.company_id, {
      role: UserRole.courier,
      email: 'courier@example.com',
      password: 'SecurePass123!',
      firstName: 'Courier',
      lastName: 'User',
      phone: '+79990000000',
    });

    const createCall = prismaTx.user.create.mock.calls[0]?.[0];
    expect(createCall?.data.password_hash).toEqual(expect.any(String));
    await expect(
      bcrypt.compare('SecurePass123!', createCall?.data.password_hash as string),
    ).resolves.toBe(true);
    expect(prismaTx.courier.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          company_id: baseUser.company_id,
          user_id: 'user-2',
          status: CourierStatus.offline,
        }),
      }),
    );
    expect(result.role).toBe(UserRole.courier);
  });

  it('rejects duplicate email within the same company', async () => {
    prismaTx.user.findFirst.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.createUser(baseUser.company_id, {
        role: UserRole.dispatcher,
        email: baseUser.email,
        password: 'SecurePass123!',
        firstName: 'Dup',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates role from dispatcher to courier and deactivates dispatcher profile', async () => {
    prismaTx.user.findFirst.mockResolvedValueOnce({
      ...baseUser,
      role: UserRole.dispatcher,
      courier: null,
      dispatcher: { is_active: true },
    });
    prismaTx.user.findFirst.mockResolvedValueOnce(null);
    prismaTx.user.update.mockResolvedValue({
      ...baseUser,
      id: 'user-3',
      role: UserRole.courier,
      email: 'user3@example.com',
      is_active: true,
    });
    prismaTx.courier.upsert.mockResolvedValue({});
    prismaTx.dispatcher.update.mockResolvedValue({});

    const result = await service.updateUser(baseUser.company_id, 'user-3', {
      role: UserRole.courier,
      email: 'user3@example.com',
    });

    expect(prismaTx.courier.upsert).toHaveBeenCalled();
    expect(prismaTx.dispatcher.update).toHaveBeenCalledWith({
      where: { user_id: 'user-3' },
      data: { is_active: false },
    });
    expect(result.role).toBe(UserRole.courier);
  });

  it('throws NotFoundException when updating missing tenant user', async () => {
    prismaTx.user.findFirst.mockResolvedValue(null);

    await expect(
      service.updateUser(baseUser.company_id, 'missing-user', {
        firstName: 'Nobody',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
