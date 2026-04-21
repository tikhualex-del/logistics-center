import {
  RequestMethod,
  VersioningType,
  type INestApplication,
} from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type SwaggerCustomOptions,
} from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const SWAGGER_UI_SEGMENT = 'docs';
export const SWAGGER_UI_PATH = `${API_GLOBAL_PREFIX}/docs`;

export function configureApp(app: INestApplication): void {
  app.useLogger(app.get(Logger));

  // Required for reading httpOnly refresh token cookies
  app.use(cookieParser());

  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix(API_GLOBAL_PREFIX, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });

  setupSwagger(app);
}

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Logistics Center API')
    .setDescription('SaaS logistics management platform API')
    .setVersion(API_DEFAULT_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'JWT access token. Example: Bearer <token>',
      },
      'bearer',
    )
    .build();
}

function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    createSwaggerConfig(),
  );
  const options: SwaggerCustomOptions = {
    customSiteTitle: 'Logistics Center API Docs',
    swaggerOptions: {
      displayRequestDuration: true,
      docExpansion: 'list',
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    useGlobalPrefix: false,
  };

  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, options);
}
