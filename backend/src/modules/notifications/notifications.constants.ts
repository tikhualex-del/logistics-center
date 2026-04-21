export const NOTIFICATIONS_NAMESPACE = '/notifications';
export const NOTIFICATION_EVENT = 'notification';

export function getCompanyNotificationsRoom(companyId: string): string {
  return `company:${companyId}:notifications`;
}

export function getDispatcherNotificationsRoom(companyId: string): string {
  return `company:${companyId}:dispatchers:notifications`;
}

export function getAdminNotificationsRoom(companyId: string): string {
  return `company:${companyId}:admins:notifications`;
}
