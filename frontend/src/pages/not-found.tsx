import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export default function NotFoundPage(): React.ReactElement {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">{t('pages.notFound.title')}</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.DISPATCHER}>{t('common.backToWorkspace')}</Link>
        </Button>
      </div>
    </div>
  )
}
