/* eslint-env jest */
import { User } from './models/user'
import { sequelize } from './models/connection'

import rest, { CREATE, GET_LIST, GET_ONE, UPDATE, DELETE } from '../src/index'
import Koa from 'koa'
import body from 'koa-bodyparser'
import request from 'supertest'

const setupServer = () => {
  const app = new Koa()
  app.use(body())
  return app
}

describe('User Test', () => {
  beforeAll(async () => {
    await sequelize.sync()
    await User.truncate()
  })
  it('basic', async () => {
    const app = setupServer()

    const router = rest('/users', User, [
      CREATE,
      GET_LIST,
      GET_ONE,
      UPDATE,
      DELETE
    ])
    app.use(router.routes()).use(router.allowedMethods())
    const server = app.callback()

    // post
    let res = await request(server)
      .post('/users')
      .send({ name: 'takashi' })
    expect(res.status).toBe(201)
    expect(res.body.id).not.toBeNull()
    expect(res.body.name).toBe('takashi')

    const { id } = res.body

    // put
    res = await request(server)
      .put(`/users/${id}`)
      .send({ name: 'toru' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('toru')

    // get
    res = await request(server).get(`/users/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('toru')

    await request(server)
      .post('/users')
      .send({ name: 'kaori' })
    await request(server)
      .post('/users')
      .send({ name: 'bob' })
    await request(server)
      .post('/users')
      .send({ name: 'steven' })

    // get list
    res = await request(server)
      .get('/users')
      .query({
        sort: JSON.stringify(['name', 'ASC']),
        range: JSON.stringify([0, 2])
      })
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const users = res.body
    expect(users[0].name).toBe('bob')
    expect(users[1].name).toBe('kaori')
  })
})
