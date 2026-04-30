import { Test, type TestingModule } from '@nestjs/testing';
import { DispatchersController } from './dispatchers.controller';
import { DispatchersService } from './dispatchers.service';

const mockDispatchersService = {
  listDispatchers: jest.fn(),
};

const dispatcherResponse = {
  id: 'dispatcher-1',
  companyId: 'company-1',
  userId: 'user-1',
  email: 'dispatcher@example.com',
  phone: '+79990000000',
  firstName: 'Anna',
  lastName: 'Ivanova',
  isActive: true,
  createdAt: new Date('2026-04-30T10:00:00.000Z'),
  updatedAt: new Date('2026-04-30T11:00:00.000Z'),
};

describe('DispatchersController', () => {
  let controller: DispatchersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchersController],
      providers: [
        { provide: DispatchersService, useValue: mockDispatchersService },
      ],
    }).compile();

    controller = module.get<DispatchersController>(DispatchersController);
  });

  it('lists dispatchers in tenant scope', async () => {
    mockDispatchersService.listDispatchers.mockResolvedValue([
      dispatcherResponse,
    ]);

    await expect(controller.listDispatchers('company-1')).resolves.toEqual([
      dispatcherResponse,
    ]);
    expect(mockDispatchersService.listDispatchers).toHaveBeenCalledWith(
      'company-1',
    );
  });
});
