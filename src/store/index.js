import { createStore } from 'vuex'
import bingo from './modules/bingo'
import trades from './modules/trades';
import riskManagement from './modules/riskManagement';

export default createStore({
  modules: {
    bingo,
    trades,
    riskManagement
  }
});