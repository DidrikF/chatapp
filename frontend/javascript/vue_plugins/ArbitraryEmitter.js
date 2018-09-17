export default new class {
	constructor() {
		this.listeners = new Map() //Will contain all the listeners. The index can be anything. The index is associated with an array holding objects which contain a listener and a vm to execute it on.
	}

	addListener(label, callback, vm) {
		if(typeof callback == 'function') {
			this.listeners.has(label) || this.listeners.set(label, []) //if no such label exists yet, create it an set equal to emply array (this array is to hold the listeners)
			this.listeners.get(label).push({callback: callback, vm: vm})
			
			return true
		}
		return false
	}

	removeListener(label, callback, vm) {
		let listeners = this.listeners.get(label)
		let index

		if(listeners && listeners.length) {
			//# Need to underestand better... we find the index of the listener matching the provided callback and vm
			index = listeners.reduce((i, listener, index) => { //accumulator, currentValue, currentIndex
				return (typeof listener.callback == 'function' && listener.callback === callback && listener.vm == vm) ? i = index : i //return the accumulator (-1 each time) until you find a matching listener, then the accumulator is set equal to the current index
			}, -1) //-1 is the initial value of the accumulator
			/*
				The index of the LAST MATCHING listener will in the end be returned. If no listener matched, '-1' is returned.  
			*/
			
			if(index > -1) {
				listeners.splice(index, 1) //remove the listener object from the array at that index
				this.listeners.set(label, listeners) //we have modified the listener object, we need to reset it on the map
				return true //successfully removed the listener
			}
		}
		return false //not successfull, no such listener ()
	}

	emit(label, ...args) {	//packet.data[1]
		let listeners = this.listeners.get(label)

		if(listeners && listeners.length) {
			listeners.forEach((listener) => {	//RUNS ALL THE LISTENERS UNDER THAT LABEL, or type of event.
				listener.callback.call(listener.vm, ...args) //this = listener.vm
			})
			return true
		}
		return false
	}
}
