import * as Router from 'koa-router'
import 'koa-bodyparser'

import { Model, Document } from 'mongoose'

export const GET_LIST = 'GET_LIST'
export const GET_ONE = 'GET_ONE'
export const CREATE = 'CREATE'
export const UPDATE = 'UPDATE'
export const DELETE = 'DELETE'

const ACTION_TO_FUNC: {
  [action: string]: (
    router: Router,
    model: Model<any>,
    toJson: (doc: Document) => Promise<any>
  ) => void
} = {
  [GET_LIST]: getList,
  [GET_ONE]: getOne,
  [CREATE]: create,
  [UPDATE]: update,
  [DELETE]: delete_
}

function toJsonDefault(doc: Document) {
  const o = doc.toObject()
  delete o._id
  delete o.__v
  return {
    id: doc._id,
    ...o
  }
}

function rest(
  prefix: string,
  model: Model<any>,
  actions?: Array<string>,
  toJson?: (doc: Document) => Promise<any>
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

function getList(
  router: Router,
  model: Model<any>,
  toJson: (doc: Document) => Promise<any>
) {
  router.get('/', async (ctx) => {
    console.log(ctx.query)
    let { sort, range, filter } = ctx.query
    if (sort) {
      const a = JSON.parse(sort)
      sort = { [a[0]]: a[1] === 'ASC' ? 1 : -1 }
    }
    let skip = 0
    let limit = 100
    if (range) {
      const a = JSON.parse(range)
      skip = a[0]
      limit = a[1] - skip
    }

    filter = filter ? JSON.parse(filter) : {}
    if ('id' in filter) {
      filter._id = filter.id
      delete filter.id
    }
    const items = await model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec()
    const total = await model.count(filter)

    ctx.set('Content-Range', `${skip}-${skip + limit}/${total}`)
    ctx.body = await Promise.all(items.map(item => toJson(item)))
  })
}

function getOne(
  router: Router,
  model: Model<any>,
  toJson: (doc: Document) => Promise<any>
) {
  router.get('/:id', async (ctx, next) => {
    const { id } = ctx.params
    const item = await model.findOne({ _id: id })
    if (!item) {
      return ctx.throw(404, { error: 'Not fould' })
    }
    ctx.body = await toJson(item)
  })
}

function create(
  router: Router,
  model: Model<any>,
  toJson: (doc: Document) => Promise<any>
) {
  router.post('/', async (ctx, next) => {
    const data = ctx.request.body
    const item = await model.create(data)
    ctx.body = await toJson(item)
  })
}

function update(
  router: Router,
  model: Model<any>,
  toJson: (doc: Document) => Promise<any>
) {
  router.put('/:id', async (ctx, next) => {
    const { id } = ctx.params
    const data = ctx.request.body
    const item = await model.findOne({ _id: id })
    if (!item) {
      return ctx.throw(404, { error: 'Not fould' })
    }
    await item.update(data)
    ctx.body = await toJson(item)
  })
}

function delete_(
  router: Router,
  model: Model<any>
) {
  router.delete('/:id', async (ctx, next) => {
    const { id } = ctx.params
    await model.deleteOne({ _id: id })
    ctx.body = { id }
  })
}

export default rest
