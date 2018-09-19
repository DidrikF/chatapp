import Vue from 'vue'
import localforage from 'localforage'


localforage.config({
	driver: localforage.LOCALSTORAGE,
	storeName: 'chatapp'
})


import Register from './components/Register.vue'
import Login from './components/Login.vue'


Vue.component('register', Register)
Vue.component('login', Login)

let vm = new Vue({
	el: '#app',
}) 
