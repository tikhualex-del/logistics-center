import { useTranslation } from 'react-i18next'

export function PageLoader(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
    </div>
  )
}
