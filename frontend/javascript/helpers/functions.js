import { isEmpty } from 'lodash'
import axios from 'axios'

export const setHttpToken = (token) => {

	if(isEmpty(token)) {
		window.axios.defaults.headers.common['Authorization'] = null
	}

	window.axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
}



export const isTokenValid = () => { //assume token is set at this point (NOT USED ATM)
	return axios.get('/auth/istokenvalid')
}