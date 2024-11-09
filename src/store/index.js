import { createStore } from 'vuex'
import bingo from './modules/bingo'

export default createStore({
  modules: {
    bingo
  }
})