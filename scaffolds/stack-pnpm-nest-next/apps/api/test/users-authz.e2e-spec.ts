import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Negative-authz spec for the id-addressed /users resource — the reference
 * example the `check-authz-test-present.mjs` gate requires for every controller
 * exposing a row addressed by id. Integration spec against a real Postgres
 * (`pnpm db:migrate && pnpm db:seed`), same infra as auth-login-me.e2e-spec.ts.
 *
 * It proves the two authz boundaries a `@Get(':id')` resource must hold:
 *   - default-deny: no token → 401 on every /users route (JwtAuthGuard);
 *   - privilege level: a non-ADMIN principal → 403 on the admin-only mutations
 *     (RolesGuard + @Roles('ADMIN')), while a read stays open by this skeleton's
 *     design (findOne carries no @Roles — any authenticated role may read).
 *
 * OBJECT-LEVEL note (Leg-16 / IDOR): the skeleton's users resource is
 * admin-managed and its reads are intentionally role-open, so there is no
 * per-owner scope to diverge between two same-role callers. When you scope a
 * resource by owner/tenant (an order, a lead, a submission), EXTEND this pattern
 * with the owner-A-creates → non-owner-B-requests-A's-id → expect 403/404 case,
 * and assert B cannot read A's PII/token even at the same privilege level.
 */
describe('Users authz (e2e)', () => {
  let app: INestApplication;
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';
  const member = { email: `member-${Date.now()}@example.com`, password: 'member1234', name: 'Member Persona' };

  let adminToken: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    // admin creates a MEMBER persona, then that persona logs in
    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...member, role: 'MEMBER' })
      .expect(201);
    memberId = created.body.id;

    const memberLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: member.email, password: member.password })
      .expect(200);
    memberToken = memberLogin.body.accessToken;
    expect(memberLogin.body.user.role).toBe('MEMBER');
  });

  afterAll(async () => {
    if (memberId && adminToken) {
      await request(app.getHttpServer())
        .delete(`/users/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    await app.close();
  });

  it('default-deny: unauthenticated requests are 401 on every /users route', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
    await request(app.getHttpServer()).get(`/users/${memberId}`).expect(401);
    await request(app.getHttpServer()).post('/users').send(member).expect(401);
    await request(app.getHttpServer()).patch(`/users/${memberId}`).send({ name: 'x' }).expect(401);
    await request(app.getHttpServer()).delete(`/users/${memberId}`).expect(401);
  });

  it('under-privileged: a MEMBER is 403 on the admin-only mutations', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: `x-${Date.now()}@example.com`, password: 'another1234', name: 'Nope' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/users/${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Renamed' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/users/${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('authenticated read stays open by this resource design (findOne has no @Roles)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(res.body.id).toBe(memberId);
    // the serialized DTO never carries the password hash
    expect(res.body.passwordHash).toBeUndefined();
  });
});
