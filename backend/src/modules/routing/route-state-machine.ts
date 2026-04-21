import { RouteStatus } from '@prisma/client';

const ALLOWED_ROUTE_TRANSITIONS: Record<RouteStatus, readonly RouteStatus[]> = {
  [RouteStatus.draft]: [RouteStatus.planned, RouteStatus.cancelled],
  [RouteStatus.planned]: [RouteStatus.in_progress, RouteStatus.cancelled],
  [RouteStatus.in_progress]: [RouteStatus.completed, RouteStatus.cancelled],
  [RouteStatus.completed]: [],
  [RouteStatus.cancelled]: [],
};

export function canTransitionRoute(
  currentStatus: RouteStatus,
  nextStatus: RouteStatus,
): boolean {
  return ALLOWED_ROUTE_TRANSITIONS[currentStatus].includes(nextStatus);
}
