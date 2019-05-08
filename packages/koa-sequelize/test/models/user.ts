import { DataTypes, Model, HasMany } from 'sequelize'
import { sequelize } from './connection'

export class User extends Model {
  public id: number
  public name: string
  public createdAt: Date
  public updatedAt: Date

  public static associations: {
    posts: HasMany
  }
  public posts: Post[]
}

User.init(
  {
    name: DataTypes.STRING
  },
  {
    sequelize
  }
)
import { Post } from './post'

User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts'
})
