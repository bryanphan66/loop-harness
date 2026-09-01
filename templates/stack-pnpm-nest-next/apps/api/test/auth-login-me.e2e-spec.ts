import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Integration spec against a real Postgres (CI service container or local docker db).
 * Requires migrations applied and the seed admin present (`pnpm db:migrate && pnpm db:seed`).
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health -> 200 with db up', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
  });

  it('POST /auth/login with seeded admin -> tokens, then GET /auth/me', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));
    expect(login.body.user.role).toBe('ADMIN');

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(email);
  });

  it('rejects bad credentials and missing tokens', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'definitely-wrong' })
      .expect(401);

    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
