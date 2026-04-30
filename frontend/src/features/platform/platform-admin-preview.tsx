import type { ReactElement } from 'react'
import { Building2, ShieldCheck, UserRoundSearch } from 'lucide-react'

const PLATFORM_AREAS = [
  {
    title: 'Компании',
    description: 'Список компаний, создание tenant, статусы active/suspended и карточка компании.',
    Icon: Building2,
  },
  {
    title: 'Super-admins',
    description: 'Пользователи платформы, статусы active/suspended и защита последнего активного администратора.',
    Icon: ShieldCheck,
  },
  {
    title: 'Impersonation',
    description: 'Вход в контекст компании с auditable session и отдельным impersonation token.',
    Icon: UserRoundSearch,
  },
] as const

export function PlatformAdminPreview(): ReactElement {
  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-background p-4 md:p-6">
      <div className="border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Platform admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Super-admin поверхность
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          UI-сценарии из legacy сохранены как контракт, но боевые формы будут подключены после backend задачи 11.5: platform module, super-admin auth, impersonation и tenant provisioning.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLATFORM_AREAS.map((area) => {
          const Icon = area.Icon

          return (
            <article
              key={area.title}
              className="rounded-lg border border-border bg-card p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">
                {area.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {area.description}
              </p>
            </article>
          )
        })}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        Waive for 11.4 implementation: не подключаем к tenant `auth` и не добавляем fake API. Источник для следующего шага зафиксирован в audit 11.2 и будет реализован в 11.5.
      </div>
    </section>
  )
}
