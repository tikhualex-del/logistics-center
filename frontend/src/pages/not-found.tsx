import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

/**
 * 404 — Not Found page.
 */
export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.DISPATCHER}>Back to workspace</Link>
        </Button>
      </div>
    </div>
  )
}
