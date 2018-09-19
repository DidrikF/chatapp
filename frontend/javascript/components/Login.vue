<template>
    <main class="login">
        <nav class="navigation">
            <a href="/livedemo/chatapp/">Register</a>
            <a href="/livedemo/chatapp/app">Chat</a>
        </nav>
        <img class="currentAvatar" v-bind:src="currentAvatar" alt="">
        <div class="inputs">
            <input class="username" type="text" v-model="username" placeholder="Username">
            <input class="password" type="password" v-model="password" placeholder="Password">
            <a class="registerButton" @click="login">Login</a>
        </div>
        <div class="attribution">
            <a href="http://www.freepik.com">Avatars designed by Freepik</a>
        </div>
    </main>
</template>

<script>
import axios from 'axios'
import localforage from 'localforage'

export default {
    data () {
        return {
            username: "",
            password: "",
            avatars: [
                'images/bewer.jpg',
                'images/cat.jpg',
                'images/cow.jpg',
                'images/donky.jpg',
                'images/duck.jpg',
                'images/lion.jpg',
                'images/penguin.jpg',
                'images/sea_lion.jpg',
            ],
            currentAvatar: 'images/bewer.jpg',
            index: 7,
        }
    },
    created () {
        setInterval(() => {
            this.nextAvatar()
        }, 3000)
    },
    methods: {
        nextAvatar () {
            this.index++
            const i = this.index % 8
            this.currentAvatar = this.avatars[i]
        },
        login () {
            axios.post('/livedemo/chatapp/auth/login', {
                username: this.username,
                password: this.password
            })
            .then((response) => {                
                Promise.all([
                    localforage.setItem('user', response.data.user), 
                    localforage.setItem('jwt', response.data.jwt)
                ]).then(() => {
                    window.location.replace('/livedemo/chatapp/app')
                })
                
            })
            .catch((error) => {
                if(error.response) this.login.errors = error.response.data
                console.log(error)
            })
        }
    }
}
</script>
