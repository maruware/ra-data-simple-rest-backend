import Koa from 'koa'
import koaBody from 'koa-body'
import Router from 'koa-router'

import request from 'supertest'
import { buildAuth, AdminUser } from '../src/index'

const setupServer = (admins: AdminUser[]) => {
  const app = new Koa()
  app.use(koaBody())

  const auth = buildAuth('my secret', admins)

  const router = new Router()
  router.use('/auth', auth.router.routes(), auth.router.allowedMethods())

  const apiRouter = new Router()
  apiRouter.get('/sample', async ctx => {
    ctx.body = 'ok'
  })
  router.use(auth.middleware, apiRouter.routes(), apiRouter.allowedMethods())

  app.use(router.routes()).use(router.allowedMethods())

  const server = app.callback()

  return server
}

describe('User Test', () => {
  it('basic', async () => {
    const admins = [{ username: 'takashi', password: 'my_password' }]

    const server = setupServer(admins)
    let res = await request(server).get('/sample')
    expect(res.status).toBe(401)

    res = await request(server).get('/auth/verify')
    expect(res.status).toBe(401)

    res = await request(server)
      .post('/auth')
      .send(admins[0])
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()

    let { token } = res.body

    res = await request(server)
      .get('/sample')
      .set('Authorization', token)
    expect(res.status).toBe(200)

    res = await request(server)
      .get('/auth/verify')
      .set('Authorization', token)
    expect(res.status).toBe(200)
  })

  it('should fail with bad user', async () => {
    const admins = [{ username: 'takashi', password: 'my_password' }]

    const server = setupServer(admins)

    let res = await request(server)
      .post('/auth')
      .send({ username: 'takashi', password: 'bad_password' })
    expect(res.status).toBe(401)

    res = await request(server)
      .post('/auth')
      .send({ username: 'bob', password: 'my_password' })
    expect(res.status).toBe(401)
  })
})
