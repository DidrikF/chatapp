export const setUser = (state, user) => {
	state.user = user
}

export const setAuthenticated = (state, boolValue) => {
	state.authenticated = boolValue
}

export const SOCKET_SET_USER = (state, data) => {
	state.user = data.user
}