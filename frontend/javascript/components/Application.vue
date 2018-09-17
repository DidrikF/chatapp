<template>
    <div>
        <div>
            <navigation></navigation>

            <div class="container">
                
                <router-view></router-view>
                
            </div>
        </div>
    </div>
</template>

<script>
	import { mapActions, mapGetters } from 'vuex'
	export default {
        data() {
            return {

            }
        },
        methods: {
            
        }
	}

</script>


