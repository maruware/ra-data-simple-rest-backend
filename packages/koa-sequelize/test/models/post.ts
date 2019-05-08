import { DataTypes, Model, BelongsTo } from 'sequelize'
import { sequelize } from './connection'

export class Post extends Model {
  public id: number
  public userId: number
  public title: string
  public createdAt: Date
  public updatedAt: Date

  public static associations: {
    user: BelongsTo
  }
}

Post.init(
  {
    userId: DataTypes.INTEGER,
    title: DataTypes.STRING
  },
  {
    sequelize
  }
)
