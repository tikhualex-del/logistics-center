import { RouteStatus } from '@prisma/client';
import { canTransitionRoute } from './route-state-machine';

describe('route state machine', () => {
  const expectedTransitions: Record<RouteStatus, readonly RouteStatus[]> = {
    [RouteStatus.draft]: [RouteStatus.planned, RouteStatus.cancelled],
    [RouteStatus.planned]: [RouteStatus.in_progress, RouteStatus.cancelled],
    [RouteStatus.in_progress]: [RouteStatus.completed, RouteStatus.cancelled],
    [RouteStatus.completed]: [],
    [RouteStatus.cancelled]: [],
  };

  it.each(
    Object.entries(expectedTransitions) as [RouteStatus, RouteStatus[]][],
  )('allows only valid transitions from %s', (fromStatus, allowedStatuses) => {
    for (const toStatus of Object.values(RouteStatus)) {
      expect(canTransitionRoute(fromStatus, toStatus)).toBe(
        allowedStatuses.includes(toStatus),
      );
    }
  });

  it('rejects self-transitions for every route status', () => {
    for (const status of Object.values(RouteStatus)) {
      expect(canTransitionRoute(status, status)).toBe(false);
    }
  });

  it('rejects all transitions from terminal route states', () => {
    const terminalStatuses = [RouteStatus.completed, RouteStatus.cancelled];

    for (const fromStatus of terminalStatuses) {
      for (const toStatus of Object.values(RouteStatus)) {
        expect(canTransitionRoute(fromStatus, toStatus)).toBe(false);
      }
    }
  });
});
