import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, FeatureFlagsService],
  exports: [CompaniesService, FeatureFlagsService],
})
export class CompaniesModule {}
