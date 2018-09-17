import store from './vuex'
import router from './router'

import socketioVuePlugin from './vue_plugins/socketioVuePlugin'
import Emitter from './vue_plugins/ArbitraryEmitter' //need a vm

import Vue from 'vue'
import localforage from 'localforage'
import io from 'socket.io-client';

require('../sass/app.sass') //dont know what this is for, maybe required for webpack to bundle and convert the sass files

localforage.config({
	driver: localforage.LOCALSTORAGE,
	storeName: 'vue-socket'
})


import ApplicationComponent from './components/Application.vue'
import NavigationComponent from './components/Navigation.vue'


Vue.component('application', ApplicationComponent)
Vue.component('navigation', NavigationComponent)

Emitter.addListener('any_connect', function () {
	console.log('Connected to a namespace')
}, this)


Vue.use(socketioVuePlugin, [
		//i connect before i get the chance to register the listeners
		{name: 'root', instance: io.connect('/root')},	//for application wide traffic
		{name: 'chat', instance: io.connect('/chat')} //io.connect('/chat')
	], store)

Vue.prototype.$mainSocket = io.connect() //available in all vue instance and instance inherreting from Vue

let vm = new Vue({
	el: '#app',
	store: store,
	router: router,
	sockets: {
		config: {
			namespace: 'root'
		},
		root_disconnect() {
			console.log('The root namespace had a disconnect event')
		}
	}

	//How to register listeners for foreign namespace 

}) 

//console.log(vm.$sockets)

//["connect", "error", "disconnect", "reconnect", "reconnect_attempt", "reconnecting", 
//"reconnect_error", "reconnect_failed", "connect_error", "connect_timeout", "connecting", "ping", "pong"]