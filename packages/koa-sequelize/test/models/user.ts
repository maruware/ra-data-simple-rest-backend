import { DataTypes, Model } from 'sequelize'
import { sequelize } from './connection'

export class User extends Model {
  public id: number
  public name: string
  public createdAt: Date
  public updatedAt: Date
}

User.init(
  {
    name: DataTypes.STRING
  },
  {
    sequelize
  }
)
