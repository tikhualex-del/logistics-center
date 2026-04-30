import { Module } from '@nestjs/common';
import { DispatchersController } from './dispatchers.controller';
import { DispatchersService } from './dispatchers.service';

@Module({
  controllers: [DispatchersController],
  providers: [DispatchersService],
  exports: [DispatchersService],
})
export class DispatchersModule {}
