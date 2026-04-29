import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth-request.types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  getMe: jest.fn(),
  listUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
};

const authenticatedUser: AuthenticatedUser = {
  id: 'user-1',
  email: 'admin@example.com',
  role: UserRole.admin,
  companyId: 'company-1',
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('returns current tenant user profile', async () => {
    const serviceResult = {
      id: authenticatedUser.id,
      companyId: authenticatedUser.companyId,
      role: authenticatedUser.role,
      email: authenticatedUser.email,
      phone: null,
      firstName: 'Ivan',
      lastName: 'Petrov',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date('2026-04-16T10:00:00.000Z'),
      updatedAt: new Date('2026-04-16T10:00:00.000Z'),
    };
    mockUsersService.getMe.mockResolvedValue(serviceResult);

    await expect(
      controller.getMe(authenticatedUser.id, authenticatedUser.companyId),
    ).resolves.toEqual(serviceResult);
    expect(mockUsersService.getMe).toHaveBeenCalledWith(
      authenticatedUser.id,
      authenticatedUser.companyId,
    );
  });

  it('lists company users for admin route', async () => {
    const serviceResult = [
      {
        id: 'user-2',
        companyId: authenticatedUser.companyId,
        role: UserRole.dispatcher,
        email: 'dispatcher@example.com',
        phone: null,
        firstName: 'Daria',
        lastName: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date('2026-04-16T10:00:00.000Z'),
        updatedAt: new Date('2026-04-16T10:00:00.000Z'),
      },
    ];
    mockUsersService.listUsers.mockResolvedValue(serviceResult);

    await expect(
      controller.listUsers(authenticatedUser.companyId),
    ).resolves.toEqual(serviceResult);
    expect(mockUsersService.listUsers).toHaveBeenCalledWith(
      authenticatedUser.companyId,
    );
  });

  it('creates a tenant user under the current company', async () => {
    const dto = {
      role: UserRole.courier,
      email: 'courier@example.com',
      password: 'SecurePass123!',
      firstName: 'Pavel',
      lastName: 'Sidorov',
      phone: '+79990000000',
    };
    const serviceResult = {
      id: 'user-3',
      companyId: authenticatedUser.companyId,
      role: dto.role,
      email: dto.email,
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date('2026-04-16T10:00:00.000Z'),
      updatedAt: new Date('2026-04-16T10:00:00.000Z'),
    };
    mockUsersService.createUser.mockResolvedValue(serviceResult);

    await expect(
      controller.createUser(authenticatedUser.companyId, dto),
    ).resolves.toEqual(serviceResult);
    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      authenticatedUser.companyId,
      dto,
    );
  });

  it('updates a tenant user inside the current company scope', async () => {
    const dto = {
      role: UserRole.dispatcher,
      isActive: false,
    };
    const serviceResult = {
      id: 'user-4',
      companyId: authenticatedUser.companyId,
      role: dto.role,
      email: 'user4@example.com',
      phone: null,
      firstName: 'Maria',
      lastName: null,
      isActive: false,
      lastLoginAt: null,
      createdAt: new Date('2026-04-16T10:00:00.000Z'),
      updatedAt: new Date('2026-04-16T10:10:00.000Z'),
    };
    mockUsersService.updateUser.mockResolvedValue(serviceResult);

    await expect(
      controller.updateUser(authenticatedUser.companyId, 'user-4', dto),
    ).resolves.toEqual(serviceResult);
    expect(mockUsersService.updateUser).toHaveBeenCalledWith(
      authenticatedUser.companyId,
      'user-4',
      dto,
    );
  });
});
