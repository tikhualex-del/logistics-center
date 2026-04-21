'use client'

import { useRouter } from 'next/navigation'
import { useCreateOrder } from '@/features/orders/hooks'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function CreateOrderForm() {
  const router = useRouter()
  const { mutate: createOrder, isPending, error } = useCreateOrder()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    createOrder(
      {
        customerName: data.get('customerName') as string,
        customerPhone: data.get('customerPhone') as string,
        pickupAddress: data.get('pickupAddress') as string,
        deliveryAddress: data.get('deliveryAddress') as string,
        deadline: data.get('deadline') as string || undefined,
        notes: data.get('notes') as string || undefined,
      },
      { onSuccess: (order) => router.push(ROUTES.ORDER(order.id)) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="customerName" name="customerName" label="Имя клиента" required />
      <Input id="customerPhone" name="customerPhone" label="Телефон" type="tel" />
      <Input id="pickupAddress" name="pickupAddress" label="Адрес забора" required />
      <Input id="deliveryAddress" name="deliveryAddress" label="Адрес доставки" required />
      <Input id="deadline" name="deadline" label="Дедлайн" type="datetime-local" />
      <Textarea id="notes" name="notes" label="Заметки" />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Создать заказ</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Отмена</Button>
      </div>
    </form>
  )
}
