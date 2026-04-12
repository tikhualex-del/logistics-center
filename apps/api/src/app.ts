import express from 'express';
import cors from 'cors';
import { authRouter } from './modules/auth';
import { companiesRouter } from './modules/companies';
import { ordersRouter } from './modules/orders';
import { couriersRouter } from './modules/couriers';
import { usersRouter } from './modules/users';
import { platformRouter } from './modules/platform';
import { integrationsRouter } from './modules/integrations';
import { routesRouter } from './modules/routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { tenantMiddleware } from './middlewares/tenant.middleware';
import { requireAuth } from './middlewares/auth.middleware';
import { requireSuperAdmin } from './middlewares/rbac.middleware';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ],
}));

app.use(express.json());
app.use(tenantMiddleware);

// Health check — used to verify the server is running
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);
// /companies is a platform-only route group — super admin access only.
app.use('/companies', requireAuth, requireSuperAdmin(), companiesRouter);
app.use('/orders', ordersRouter);
app.use('/couriers', couriersRouter);
app.use('/users', usersRouter);
app.use('/platform', platformRouter);
app.use('/integrations', integrationsRouter);
app.use('/routes', routesRouter);

// Must be registered after all routes
app.use(errorMiddleware);

export default app;
