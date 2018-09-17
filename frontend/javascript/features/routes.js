import chat from './chat/routes'
import auth from './auth/routes'

export default [
	...chat, 
	...auth,
	
]