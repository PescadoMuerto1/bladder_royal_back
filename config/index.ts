import configProd from './prod.js'
import configDev from './dev.js'
import { Config } from '../types/config.types.js'

export let config: Config

if (process.env.NODE_ENV === 'production') {
  config = configProd
} else {
  config = configDev
}
