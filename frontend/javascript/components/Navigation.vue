<template>

    <nav>
        <div>
            <ul>
                <li><router-link :to="{ name: 'chat' }">Chat</router-link></li>
                <li><router-link :to="{ name: 'loginRegister' }">Login and Register</router-link></li>
            </ul>
        </div>
    </nav>

</template>

<script>
    import { mapGetters, mapActions } from 'vuex'

    export default {

    }

</script>

