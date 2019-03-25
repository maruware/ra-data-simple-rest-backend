import Router from 'koa-router'
import 'koa-body'

import { Model } from 'sequelize'

export const GET_LIST = 'GET_LIST'
export const GET_ONE = 'GET_ONE'
export const CREATE = 'CREATE'
export const UPDATE = 'UPDATE'
export const DELETE = 'DELETE'

const ACTION_TO_FUNC = {
  [GET_LIST]: getList,
  [GET_ONE]: getOne,
  [CREATE]: create,
  [UPDATE]: update,
  [DELETE]: delete_
}

async function toJsonDefault<M extends Model>(instance: M) {
  return instance.toJSON()
}

function rest<M extends Model>(
  prefix: string,
  model: { new (): M } & typeof Model,
  actions?: Array<string>,
  toJson?: (instance: M) => Promise<any>
) {
  if (!actions) {
    actions = Object.keys(ACTION_TO_FUNC)
  }
  if (!toJson) {
    toJson = toJsonDefault
  }

  const router = new Router({ prefix })

  actions.forEach(action => {
    ACTION_TO_FUNC[action](router, model, toJson)
  })

  return router
}

function getList<M extends Model>(
  router: Router,
  model: {new (): M} & typeof Model,
  toJson: (instance: M) => Promise<any>
) {
  router.get('/', async (ctx) => {
    let { sort, range, filter } = ctx.query
    if (sort) {
      const a = JSON.parse(sort)
      sort = { [a[0]]: a[1] === 'ASC' ? 1 : -1 }
    }
    let offset = 0
    let limit = 100
    if (range) {
      const a = JSON.parse(range)
      offset = a[0]
      limit = a[1] - offset
    }

    filter = filter ? JSON.parse(filter) : {}
    const items: M[] = await model.findAll({
      where: filter,
      offset,
      limit
    })
    const total: number = await model.count(filter)

    ctx.set('Content-Range', `${offset}-${offset + limit}/${total}`)
    ctx.body = await Promise.all(items.map(item => toJson(item)))
  })
}

function getOne<M extends Model>(
  router: Router,
  model: {new (): M} & typeof Model,
  toJson: (instance: M) => Promise<any>
) {
  router.get('/:id', async (ctx, next) => {
    const { id } = ctx.params
    const item = await model.findByPk(id)
    if (!item) {
      ctx.throw(404, { error: 'Not fould' })
      return
    }
    ctx.body = await toJson(item)
  })
}

function create<M extends Model>(
  router: Router,
  model: {new (): M} & typeof Model,
  toJson: (instance: M) => Promise<any>
) {
  router.post('/', async (ctx, next) => {
    const data = ctx.request.body
    const item = await model.create(data)

    ctx.status = 201
    ctx.body = await toJson(item)
  })
}

function update<M extends Model>(
  router: Router,
  model: {new (): M} & typeof Model,
  toJson: (instance: M) => Promise<any>
) {
  router.put('/:id', async (ctx, next) => {
    const { id } = ctx.params
    const data = ctx.request.body
    const item = await model.findByPk(id)
    if (!item) {
      ctx.throw(404, { error: 'Not fould' })
      return
    }
    await item.update(data)
    ctx.body = await toJson(item)
  })
}

function delete_<M extends Model>(
  router: Router,
  model: {new (): M} & typeof Model
) {
  router.delete('/:id', async (ctx, next) => {
    const { id } = ctx.params
    await model.destroy({where: {id}})
    ctx.body = { id }
  })
}

export default rest
