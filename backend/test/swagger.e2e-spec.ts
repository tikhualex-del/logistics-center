import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  configureApp,
  SWAGGER_UI_PATH,
  createSwaggerConfig,
} from '../src/app.setup';
import { SwaggerModule } from '@nestjs/swagger';

describe('Swagger setup (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves swagger UI at /api/docs', async () => {
    await request(app.getHttpServer())
      .get(`/${SWAGGER_UI_PATH}`)
      .expect(200)
      .expect('content-type', /html/)
      .expect(({ text }) => {
        expect(text).toContain('Logistics Center API Docs');
        expect(text).toContain('swagger-ui-init.js');
      });
  });

  it('builds an OpenAPI document with bearer auth support', () => {
    const document = SwaggerModule.createDocument(app, createSwaggerConfig());

    expect(document.openapi).toMatch(/^3\./);
    expect(document.components?.securitySchemes?.bearer).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }),
    );
    expect(document.paths).toHaveProperty('/health');
    expect(document.paths).toHaveProperty('/api/v1');
  });
});
