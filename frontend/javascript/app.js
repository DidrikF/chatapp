import socketioVuePlugin from './vue_plugins/socketioVuePlugin'
import Emitter from './vue_plugins/ArbitraryEmitter' //need a vm

import Vue from 'vue'
import localforage from 'localforage'
import io from 'socket.io-client';

require('../sass/app.sass') //dont know what this is for, maybe required for webpack to bundle and convert the sass files

localforage.config({
	driver: localforage.LOCALSTORAGE,
	storeName: 'chatapp'
})


import Chat from './components/Chat.vue'


Vue.component('chat', Chat)


Emitter.addListener('any_connect', function () {
	console.log('Connected to a namespace')
}, this)


Vue.use(socketioVuePlugin, [
		{name: 'chat', instance: io.connect('/livedemo/chatapp/chat')}
	])

Vue.prototype.$mainSocket = io.connect('/livedemo/chatapp') //available in all vue instance and instance inherreting from Vue

window.vm = new Vue({
	el: '#app',

}) 
