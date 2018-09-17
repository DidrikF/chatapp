import Vue from 'vue'
import Vuex from 'vuex'

import auth from '../features/auth/vuex'
import chat from '../features/chat/vuex'


Vue.use(Vuex)

export default new Vuex.Store({
	modules: {
		auth: auth,
		chat: chat
	}
})