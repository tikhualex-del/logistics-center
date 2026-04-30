import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DispatcherResponseDto } from './dto/dispatcher-response.dto';

const dispatcherSelect = {
  id: true,
  company_id: true,
  user_id: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      first_name: true,
      last_name: true,
      is_active: true,
    },
  },
} satisfies Prisma.DispatcherSelect;

type DispatcherRecord = Prisma.DispatcherGetPayload<{
  select: typeof dispatcherSelect;
}>;

@Injectable()
export class DispatchersService {
  constructor(private readonly prisma: PrismaService) {}

  async listDispatchers(companyId: string): Promise<DispatcherResponseDto[]> {
    return await this.prisma.runWithTenant(companyId, async () => {
      const dispatchers = await this.prisma.dispatcher.findMany({
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
        select: dispatcherSelect,
      });

      return dispatchers.map(mapDispatcher);
    });
  }
}

function mapDispatcher(dispatcher: DispatcherRecord): DispatcherResponseDto {
  return {
    id: dispatcher.id,
    companyId: dispatcher.company_id,
    userId: dispatcher.user_id,
    email: dispatcher.user.email,
    phone: dispatcher.user.phone,
    firstName: dispatcher.user.first_name,
    lastName: dispatcher.user.last_name,
    isActive: dispatcher.is_active && dispatcher.user.is_active,
    createdAt: dispatcher.created_at,
    updatedAt: dispatcher.updated_at,
  };
}
