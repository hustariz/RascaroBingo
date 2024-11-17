import { createStore } from 'vuex'
import bingo from './modules/bingo'
import trades from './modules/trades';

export default createStore({
  modules: {
    bingo,
    trades
  }
});