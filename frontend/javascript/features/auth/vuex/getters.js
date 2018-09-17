/* 
These are not needed, think of getters as computed properties, 
not as the only way to access store state. 
*/

export const user = (state) => {
	return state.user
}

export const authenticated = (state) => {
	return state.authenticated
}