<template>
<div class="container">
    <div class="row" style="margin-top:20px">
        <div class="col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3">
            <form role="form">
                <fieldset>
                    <h2>Please Register</h2>
                    <hr class="colorgraph">
                    <div class="form-group">
                        <input type="email" name="email" id="email" class="form-control input-lg" placeholder="Username" v-model="register.username">
                    </div>
                    <div class="form-group">
                        <input type="password" name="password" id="password" class="form-control input-lg" placeholder="Password" v-model="register.password">
                    </div>
                    <hr class="colorgraph">
                    <div class="alert alert-success" v-if="register.message">
                        {{ register.message }}
                    </div>
                    <div class="row">
                        <div class="col-xs-6 col-sm-6 col-md-6">
                            <a href="" class="btn btn-lg btn-primary btn-block" @click.prevent="registerUser">Register</a>
                        </div>
                    </div>
                </fieldset>
            </form>
        </div>
    </div>

    <div class="row" style="margin-top:20px">
        <div class="col-xs-12 col-sm-8 col-md-6 col-sm-offset-2 col-md-offset-3">
            <form role="form">
                <fieldset>
                    <h2>Please Sign In</h2>
                    <hr class="colorgraph">
                    <div class="form-group">
                        <input type="email" name="email" id="email" class="form-control input-lg" placeholder="Username" v-model="login.username">
                    </div>
                    <div class="form-group">
                        <input type="password" name="password" id="password" class="form-control input-lg" placeholder="Password" v-model="login.password">
                    </div>
                    <hr class="colorgraph">
                    <div class="alert alert-success" v-if="login.message">
                        {{ login.message }}
                    </div>
                    <div class="row">
                        <div class="col-xs-6 col-sm-6 col-md-6">
                            <a href="" class="btn btn-lg btn-primary btn-block" @click.prevent="loginUser">Login</a>
                        </div>
                    </div>
                </fieldset>
            </form>
            <div class="row">
                <div class="col-xs-6 col-sm-6 col-md-6">
                    <a href="" class="btn btn-lg btn-primary btn-block" @click.prevent="logoutUser">Logout</a>
                </div>
            </div>
            <div class="row">
                <div class="alert alert-success" v-if="logout.message">
                    {{ logout.message }}
                </div>
            </div>
        </div>
    </div>

    <h3>Registraton errors:</h3>
    <div>
        <p v-bind:key="index" v-for="(error, index) in register.errors">{{ error.message }}</p>
    </div>

    <h3>Login Errors:</h3>
    <div>
        <p v-bind:key="index" v-for="(error, index) in login.errors">{{ error }}</p>
    </div>

    <h3>Logout Errors:</h3>
    <div>
        <p v-bind:key="index" v-for="(error, index) in logout.errors">{{ error }}</p>
    </div>
</div>

</template>

<script>
import axios from 'axios'
import localforage from 'localforage'
import { mapGetters, mapActions, mapMutations } from 'vuex'

export default {
    data() {
        return {
            register: {
                username: "EmilieF",
                password: "password123",
                errors: null,
                message: ''
            },
            login: {
                username: "EmilieF",
                password: "password123",
                errors: null,
                message: ''
            },
            logout: {
                errors: null,
                message: '',
            }
        }
    },
    computed: {
        ...mapGetters({ //very few things need a getter, only when you have some logic to go with fetching the data.
            user: 'auth/user',
            authenticated: 'auth/authenticated'
        })
    },
    methods: {
        ...mapMutations({
            setUser: 'auth/setUser',
            setAuthenticated: 'auth/setAuthenticated'
        }), 
        registerUser() {
            axios.post('/auth/register', {
                username: this.register.username,
                password: this.register.password
            })
            .then((response) => {
                this.register.errors = null
                this.clearRegistrationFields()
                this.clearMessages()
                this.register.message = response.data.message
            })
            .catch((error) => {
                this.register.errors = error.response.data
            })
        },
        loginUser() {
            

            axios.post('/auth/login', {
                username: this.login.username,
                password: this.login.password
            })
            .then((response) => {                
                this.setUser(response.data.user)
                this.setAuthenticated(response.data.authenticated)
                this.clearLoginFields()
                this.clearMessages()
                this.login.message = response.data.message
                
                /* THIS IS NOT WORKING! */
                this.$mainSocket.emit('event', "hello in main namespace")
                
                this.$sockets['root'].socket.emit('reloadConnection')
                /*
                for(let socketName in this.$sockets) {
                    if (this.$sockets.hasOwnProperty(socketName)) {
                        console.log(socketName)
                        console.log(this.$sockets[socketName].socket)
                        this.$sockets[socketName].socket.emit("reloadConnection")
                    }
                }
                */
            })
            .catch((error) => {
                if(error.response) this.login.errors = error.response.data
                console.log(error)
            })
        },
        logoutUser() {
            axios.post('/auth/logout')
            .then((response) => {
                this.setUser({})
                this.setAuthenticated(response.data.authenticated)
                if(response.status === 200) {
                    this.clearMessages()
                    this.logout.message = "Successfully logged out!"
                }
            })
            .catch((error) => {
                this.logout.errors = error.response.data
            })
        },
        clearLoginFields() {
            this.login.errors = null
            this.login.username = ''
            this.login.password = ''
            this.login.message = ''
        },
        clearRegistrationFields() {
            this.register.errors = null
            this.register.username = ''
            this.register.password = ''
            this.register.message = ''
        },
        clearMessages() {
            this.register.message = ''
            this.login.message = ''
            this.logout.message = ''
        }
    }
    
}            
</script>





