import { SetMetadata } from '@nestjs/common';

export const PLATFORM_ROUTE_KEY = 'platform_route';

export const PlatformRoute = () => SetMetadata(PLATFORM_ROUTE_KEY, true);
