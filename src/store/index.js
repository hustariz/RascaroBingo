import { createStore } from 'vuex'
import bingo from './modules/bingo'
import trades from './modules/trades'
import riskManagement from './modules/riskManagement'
import leaderboard from './modules/leaderboard'
import shop from './modules/shop'

export default createStore({
  modules: {
    bingo,
    trades,
    riskManagement,
    leaderboard,
    shop
  }
});