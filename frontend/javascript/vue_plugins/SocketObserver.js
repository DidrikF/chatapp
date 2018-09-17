import Emitter from './ArbitraryEmitter' //Just to register, remove and execute arbitrary functions when socket.io event are emitted
import Socket from 'socket.io-client'
import { snakeCase, camelCase, isEmpty } from 'lodash'

export default class{
	constructor(connection, store) {
		if(typeof connection == 'string') {
			this.socket = Socket(connection)
		} else {
			this.socket = connection
		}
		if(store) this.store = store

		this.onEvent()	
	}
	
	onEvent() {
		var super_onevent = this.socket.onevent

		this.socket.onevent = (packet) => {	//registering event hanlder on the socket object
			super_onevent.call(this.socket, packet) 

			Emitter.emit(this.getNamespaced(packet.data[0]), packet.data[1]) //emit both namespaced listeners
			Emitter.emit('any_'+packet.data[0], packet.data[1])				 //and listeners to be called regardless of namespace

			if(this.store && packet.data[1]) this.passToStore('SOCKET_' + packet.data[0], packet.data[1], this.socket.nsp.substring(1))

		}
	}

		/*
		let _this = this

		["connect", "error", "disconnect", "reconnect", "reconnect_attempt", "reconnecting", "reconnect_error", "reconnect_failed", "connect_error", "connect_timeout", "connecting", "ping", "pong"]
			.forEach((value) => {
				_this.Socket.on(value, (data) => {	
					Emitter.emit(value, data)

					if(this.store) this.passToStore('SOCKET_'+value, data)	//Pass event to store for all default messages
				})
			})
		*/
	
	// all listeners are prefixed with the namespace of the socket (defaulting to root_)
	getNamespaced(eventName) {
		var namespace = this.socket.nsp.substring(1) //removing '/' i gues
		if(namespace === '') return 'root_'+eventName
		return namespace+'_'+eventName
	}


	passToStore(event, payload, socketNsp) {
		if(!event.startsWith('SOCKET_')) return
		if(isEmpty(payload.vuex) ) { //if no vuex options are given
			this.runVuexMutationsAndActionsInNamespace(event, payload, socketNsp)
			return
		}

		if(!isEmpty(payload.vuex)){ //if vuex options are given
			//if not namespaced
			if(!payload.vuex.namespaced) {	//anything evaluated to false (like null and false)
				this.runVuexMutationsAndActionsInAllNamespaces(event, payload)
				return
			}

			//if namespaced
			if(payload.vuex.namespaced || isEmpty(payload.vuex.namespaced)) { //anything evaluating to true or empty
				if(!isEmpty(payload.vuex.namespace)) {
					//run mutations and actions in the namespace specified by the server
					let providedNamespace = payload.vuex.namespace
					if(payload.vuex.namespace.charAt(0) === '/') providedNamespace = providedNamespace.substring(1) //remove the '/', if any

					this.runVuexMutationsAndActionsInNamespace(event, payload, providedNamespace)
					return 
				} else {
					//run mutations and actions in the socket namespace
					this.runVuexMutationsAndActionsInNamespace(event, payload, socketNsp)
					return
				}
			}
		}
	}

	//ONLY WORKS FOR ONE LEVEL OF NAMESPACING
	runVuexMutationsAndActionsInNamespace(event, payload, nsp) {
		for(let namespaced in this.store._mutations) { //chat/EVENT1 , chat/EVENT2 , root/EVENT1

			if(!namespaced.split('/').pop().startsWith('SOCKET_')) continue //many mutations is not associated with socket.io

			let namespacedEvent = nsp ? nsp+'/'+snakeCase(event).toUpperCase() : snakeCase(event).toUpperCase() //chat/SOCKET_EVNET1

			/*running the vuex mutation*/
			if(namespaced === namespacedEvent) this.store.commit(namespaced, payload) 
		}

		for(let namespaced in this.store._actions) {
			let action = namespaced.split('/').pop()  // chat/socket_newConnect

			if(!action.startsWith('socket_')) continue //skip, many actions will not be associated with socket.io

			let camelcased = 'socket_' + camelCase(event.replace('SOCKET_', ''))
			let namespacedEvent = nsp ? nsp+'/'+camelcased : camelcased
			
			/*running the vuex action*/
			if(namespaced === namespacedEvent) this.store.dispatch(namespaced, payload) 
		}
	}


	//Shuold also work for deeply nested namespaces
	runVuexMutationsAndActionsInAllNamespaces(event, payload) {
		for(let namespaced in this.store._mutations) { //chat/newEvent1 , chat/event2 , root/event1
			let mutation = namespaced.split('/').pop()
			
			if(!mutation.startsWith('SOCKET_')) continue

			let snakecasedEvent = snakeCase(event).toUpperCase()
			if(mutation === snakecasedEvent) this.store.commit(namespaced, payload) //disregarding the namespace when comparing
		}

		for(let namespaced in this.store._actions) { 
			let action = namespaced.split('/').pop()  // chat/socket_connect
			if(!action.startsWith('socket_')) continue

			let camelcasedEvent = 'socket_' + camelCase(event.replace('SOCKET_', ''))

			if(action === camelcasedEvent) this.store.dispatch(namespaced, payload)
		}
	}
}

/*

if no vuex
	run namespaced mutations and actions in namespace event originated in

if vuex
	check options
		if namespaced === false
			run all action and mutations regardless of namespace
		if namespaced === true or not set
			run namespaced mutations
		if namspaced === true or not set and namespace === something
			run actions and mutations in something namespace


*/