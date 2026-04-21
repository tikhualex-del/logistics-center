import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextState {
  bypassTenant?: boolean;
  companyId?: string;
  requestId?: string;
}

const tenantContextStorage = new AsyncLocalStorage<TenantContextState>();

export function getTenantContextState(): TenantContextState {
  return tenantContextStorage.getStore() ?? {};
}

export function getTenantContextCompanyId(): string | undefined {
  return getTenantContextState().companyId;
}

export function getTenantContextRequestId(): string | undefined {
  return getTenantContextState().requestId;
}

@Injectable()
export class TenantContextService {
  run<T>(callback: () => T, state: TenantContextState = {}): T {
    return tenantContextStorage.run(
      {
        ...this.getStore(),
        ...state,
      },
      callback,
    );
  }

  async runAsync<T>(
    callback: () => Promise<T> | T,
    state: TenantContextState = {},
  ): Promise<Awaited<T>> {
    return await tenantContextStorage.run(
      {
        ...this.getStore(),
        ...state,
      },
      async () => await callback(),
    );
  }

  async runWithTenant<T>(
    companyId: string,
    callback: () => Promise<T> | T,
  ): Promise<Awaited<T>> {
    return await this.runAsync(callback, {
      bypassTenant: false,
      companyId,
    });
  }

  async runWithoutTenant<T>(
    callback: () => Promise<T> | T,
  ): Promise<Awaited<T>> {
    return await this.runAsync(callback, {
      bypassTenant: true,
      companyId: undefined,
    });
  }

  setCompanyId(companyId: string): void {
    tenantContextStorage.enterWith({
      ...this.getStore(),
      bypassTenant: false,
      companyId,
    });
  }

  clearCompanyId(): void {
    tenantContextStorage.enterWith({
      ...this.getStore(),
      bypassTenant: false,
      companyId: undefined,
    });
  }

  bypassTenantIsolation(): void {
    tenantContextStorage.enterWith({
      ...this.getStore(),
      bypassTenant: true,
    });
  }

  setRequestId(requestId: string): void {
    tenantContextStorage.enterWith({
      ...this.getStore(),
      requestId,
    });
  }

  clearRequestId(): void {
    tenantContextStorage.enterWith({
      ...this.getStore(),
      requestId: undefined,
    });
  }

  getCompanyId(): string | undefined {
    return this.getStore().companyId;
  }

  getRequestId(): string | undefined {
    return this.getStore().requestId;
  }

  isBypassingTenant(): boolean {
    return this.getStore().bypassTenant === true;
  }

  private getStore(): TenantContextState {
    return getTenantContextState();
  }
}
