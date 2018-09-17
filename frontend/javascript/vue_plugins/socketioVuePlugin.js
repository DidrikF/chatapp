import SocketObserver from './SocketObserver'
import Emitter from './ArbitraryEmitter' //there is only one global emitter object, so labels has to take the socket namespace into account
import { isEmpty } from 'lodash'

//Vue plugin with install method
export default  {
	install(Vue, connections, store) { 
		if(!connections) throw new Error("Socket.io connections array is missing")


		if(Array.isArray(connections)) {
			Vue.prototype.$sockets = {}

			connections.forEach(function(connection) {
				if(!connection.name) {
					throw new Error("Attempted to register a socket.io connection without a name")
					return
				}
				if(!connection.instance) {
					throw new Error("Attempted to register a socket.io connection without an instance or url")
					return
				}
				Vue.prototype.$sockets[connection.name] = new SocketObserver(connection.instance, store) //wrapping the socket in an observer to pigyback functionality as externals interact with the socket
			})		
		}


		Vue.mixin({	//Adding some methdos to all Vue instances
			methods: {
				getNamespaced(sockets, key) {
					//Weard way to deal with the case of having config as the key, MAY NOT BE NECESSARY
					if(key === 'config') return key //WHAT THE FUCK IS THIS FOR? I gues just making sure that if you try to get the namespaced version of config, you just get config back.
					
					if(key.split('_').length > 1) { //method is alleady namespaced
						return key
					}

					if(!isEmpty(sockets.config.namespace)) {//if namespaced is configured
						return sockets.config.namespace + '_' + key
					}
					throw new Error("Namespace was not correcly defined for a listener with name: " + key)
					return key //no namespace for this listener
				},
				sock(name) {
					if(!isEmpty(this.$sockets[name].socket)) {
						return this.$sockets[name].socket
					}
					throw new Error(name + " is not a registered socket")
				}
			},
			/* Now you have access to all vue instance properties and methods, you can make use of configuration parameters */
			//Adding life cycle hooks to all vue instances.
			created() {
				//You can set listeners on the 'sockests $option' on a vue instance and thet will be set on the emitter map (which holds all listensers for all events)
				let sockets = this.$options['sockets']	//this is all the methods defined on the sockets property in the components (just saving a copy before transforming $options['sockets'] to a Proxy)

				this.$options.sockets = new Proxy({}, {	//over write
					set: (target, key, value) => { 
						if(key !== 'config') {
							Emitter.addListener(this.getNamespaced(sockets, key), value, this)	//all listeners are registed with their namespace prefixed ('any_' is also a valid 'namespace' in this context)
						}
						target[key] = value	//Add the methods back to component.$options.sockets
						return true
					},
					deleteProperty: (target, key) => { //trap for the delete operator
						if(key !== 'config') {
													//'chat_connect'		methods 				   context
							Emitter.removeListener(this.getNamespaced(sockets, key), this.$options.sockets[key], this) //label, callback, vm
						}
						delete target.key	//remove from sockets option on component
						return true
					}
				})

				//this.$options.sockets.connect = function () {}
				if(sockets) {
					Object.keys(sockets).forEach((key) => {
						this.$options.sockets[key] = sockets[key]	//reapplying shit, which then also registers the listeners on the Emitter
					})
					try {
						this.$options.sock = this.$sockets[sockets.config.namespace] //read the console message below!
					} catch(error) {
						console.error(`By setting 'sockets.config.namespace' in a component, you can bind that namespaced socket.io connection to '$options.sock' for easy access. You will also not need to prefix socket listners with the namespace when declaring them in the component.`)
					}
					

					//if(!isEmpty(sockets.config.namespace))	this.$options.sock = this.$sockets[sockets.config.namespace]
				}

			},
			beforeDestroy() {
				let sockets = this.$options['sockets']


				if(sockets) {
					Object.keys(sockets).forEach((key) => {
						delete this.$options.sockets[key]	//deleteProperty is called on proxy, which in turn removes the listener from the Emitter-map. 
					})
				}
			}
		})
	}

}


/* Notes:
* Adding code to all socket.io events
this.Socket.onevent = (packet) => {	
	super_onevent.call(this.Socket, packet)
	Emitter.emit(packet.data[0], packet.data[1])
	if(this.store) this.passToStore('SOCKET_' + packet.data[0], [...packet.data.slice(1)])	
}
*/


/*

sock1 = io()
sock2 = io(/kcenter)
sock3 = io(/chat)
sock4 = io(/situationRoom)
sock5 = io(/messages)

Vue.use(Vuex)
store = new Vuex.Store({
	modules: {
		kenter: {
			namespaced: true,
			state: {
	
			},
			mutations: {
		
			},
			actions: {
	
			}
		},
		chatt: {
			namespaced: true,
			state: {
	
			},
			mutations: {
		
			},
			actions: {
	
			}
		}
	}
})


vm = new Vue({
	el: '#app',
	store: store,
	router: router,
	components: {
		kcenter: {
			data: {},
			methods{
				
			},
			created() {
	
			},
			beforeDestroy() {
	
			}
		},
		chatt: {
			data: {},
			methods{
	
			},
			created() {
	
			},
			beforeDestroy() {
	
			}
		}
	}
})


*/