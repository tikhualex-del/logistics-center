import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(
    @CurrentUser('id') userId: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<UserResponseDto> {
    return await this.usersService.getMe(userId, companyId);
  }

  @Get()
  @Roles(UserRole.admin)
  @RequirePermission('manage:users')
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async listUsers(
    @CurrentUser('companyId') companyId: string,
  ): Promise<UserResponseDto[]> {
    return await this.usersService.listUsers(companyId);
  }

  @Post()
  @Roles(UserRole.admin)
  @RequirePermission('manage:users')
  @ApiCreatedResponse({ type: UserResponseDto })
  async createUser(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.createUser(companyId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.admin)
  @RequirePermission('manage:users')
  @ApiOkResponse({ type: UserResponseDto })
  async updateUser(
    @CurrentUser('companyId') companyId: string,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateUser(companyId, userId, dto);
  }
}
