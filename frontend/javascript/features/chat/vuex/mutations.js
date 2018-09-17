//should be snakecased and all upper case

export const SOCKET_NEW_MESSAGE = (state, message) => {
	state.messages.push(message)
}

