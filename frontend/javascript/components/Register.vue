<template>
    <main class="register">
        <nav class="navigation">
            <a href="/livedemo/chatapp/login">Login</a>
            <a href="/livedemo/chatapp/app">Chat</a>
            <a href="/">DidrikFleischer.com</a>
        </nav>
        <div class="form">
            <img class="selectedAvatar" v-bind:src="selectedAvatar" alt="">
            <div class="inputs">
                <input class="username" type="text" v-model="username" placeholder="Username">
                <input class="password" type="password" v-model="password" placeholder="Password">
                <a class="registerButton" @click="register">Register</a>
            </div>
            
        </div>

        <div class="avatarContainer">
            <h3>Select an Avatar</h3>
            <div class="avatar" v-for="(avatar, index) in avatars" v-bind:key="index" >
                <img v-bind:src="avatar" alt="Avatar" @click="selectAvatar(avatar)">
            </div>
        </div>
        <div class="attribution">
            <a href="http://www.freepik.com">Avatars designed by Freepik</a>
        </div>
    </main>
</template>

<script>
import axios from 'axios'

export default {
    data () {
        return {
            username: "",
            password: "",
            selectedAvatar: 'images/bewer.jpg',
            errors: null,
            avatars: [
                'images/bewer.jpg',
                'images/cat.jpg',
                'images/cow.jpg',
                'images/donky.jpg',
                'images/duck.jpg',
                'images/lion.jpg',
                'images/penguin.jpg',
                'images/sea_lion.jpg',
            ]
        }
    },
    methods: {
        register () {
            axios.post('/livedemo/chatapp/auth/register', {
                image: this.selectedAvatar,
                username: this.username,
                password: this.password
            })
            .then((response) => {
                this.register.errors = null
                window.location.replace("/livedemo/chatapp/login")            
            })
            .catch((error) => {
                this.errors = error.response.data
                this.clearFields()
                console.log(this.errors)
            })
        },
        selectAvatar (avatar) {
            this.selectedAvatar = avatar
        },
        clearFields () {
            this.username = ""
            this.password = ""
        }
    }
}
</script>