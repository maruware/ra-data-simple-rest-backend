import { User } from './sequelize/user'
import { sequelize } from './sequelize/connection'

import rest, { CREATE, GET_LIST, GET_ONE, UPDATE, DELETE } from '../index'
import Koa from 'koa'
import request from 'supertest'

describe('User Test', () => {
  beforeAll(async () => {
    await sequelize.sync()
    await User.truncate()
  })
  it('basic', async () => {
    const router = rest('/users', User, [CREATE, GET_LIST, GET_ONE, UPDATE, DELETE ])
    const app = new Koa()
    app.use(router.routes()).use(router.allowedMethods())

    let res = await request(app.callback()).post('/users').field('name', 'takashi')
    expect(res.status).toBe(201)
    expect(res.body.id).not.toBeNull()
  })
})
