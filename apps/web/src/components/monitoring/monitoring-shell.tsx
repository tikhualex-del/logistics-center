import { ExecutionSummary } from './execution-summary'
import { RouteCardsList } from './route-cards-list'
import { CourierProgressPanel } from './courier-progress-panel'

export function MonitoringShell() {
  return (
    <div className="space-y-6">
      {/* Сводка */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Сводка
        </h2>
        <ExecutionSummary />
      </section>

      {/* Маршруты */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Активные маршруты
        </h2>
        <RouteCardsList />
      </section>

      {/* Курьеры */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Курьеры
        </h2>
        <CourierProgressPanel />
      </section>
    </div>
  )
}
