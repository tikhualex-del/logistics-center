'use client'

import { useRouter } from 'next/navigation'
import { useCreateCourier } from '@/features/couriers/hooks'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

const VEHICLE_OPTIONS = [
  { value: 'bike', label: 'Bike' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
]

export function CourierForm() {
  const router = useRouter()
  const { mutate: createCourier, isPending, error } = useCreateCourier()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    createCourier(
      {
        name: data.get('name') as string,
        phone: data.get('phone') as string || undefined,
        vehicleType: data.get('vehicleType') as string || undefined,
        licensePlate: data.get('licensePlate') as string || undefined,
      },
      { onSuccess: (courier) => router.push(ROUTES.COURIER(courier.id)) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input id="name" name="name" label="Name" required />
      <Input id="phone" name="phone" label="Phone" type="tel" />
      <Select id="vehicleType" name="vehicleType" label="Vehicle Type" options={VEHICLE_OPTIONS} placeholder="Select vehicle type" />
      <Input id="licensePlate" name="licensePlate" label="License Plate" />
      {error ? <p className="text-sm text-red-600">{(error as Error).message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>Add Courier</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
