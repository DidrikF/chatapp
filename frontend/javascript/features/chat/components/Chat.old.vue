<template>
<div class="container-fluid">
    <div class="row">
        
        <div class="col-md-3">
             <div class="row chats-row">
                
                <div class="alert alert-info" v-if="message">
                    {{ message }}
                </div>

                <div class="col-md-12">
                    <a class="list-group-item open-request">
                       <h4>Active User</h4>
                       <p v-if="user.username">Name:  {{ user.username }}</p>
                    </a>
                </div>

                <h3>People online</h3>
                <div class="col-md-12">
                    <a class="list-group-item" v-bind:key="index" v-for="(user, index) in onlineUsers" @click="toggleWhisper(user)">
                        {{ user.username }}
                    </a>
                </div>
                <h3>Public Rooms</h3>
                <div class="col-md-12">
                    <a class="list-group-item" v-bind:key="index" v-for="(room, index) in publicRooms" @click="toggleRoom(room)">
                        Name: {{ room.name }} - Owner: {{ room.owner.username }} - Max People: {{ room.peopleLimit }} - Status: {{ room.status }} - Private: {{ room.private }}
                        <div class="d-inline">
                            Members: <span class="badge badge-info" v-bind:key="index" v-for="(user, index) in room.people"> {{ user.username }} </span>
                        </div>
                        <div>
                            <button type="button" class="btn btn-success" @click="joinRoom(room)">Join room</button>
                            <button type="button" class="btn btn-warning" @click="leaveRoom(room)">Leave room</button>
                        </div>
                    </a>
                </div>
                <h3>My Rooms</h3>
                <div class="col-md-12">
                    <a class="list-group-item" v-bind:key="index" v-for="(room, index) in ownedRooms" @click="toggleRoom(room)">
                        Name: {{ room.name }} - Owner: {{ room.owner.username }} - Max People: {{ room.peopleLimit }} - Status: {{ room.status }} - Private: {{ room.private }}
                        <div class="d-inline">
                            Members: <span class="badge badge-info" v-bind:key="index" v-for="(user, index) in room.people"> {{ user.username }} </span>
                        </div>
                        <div>
                            <button type="button" class="btn btn-danger" @click="removeRoom(room)">Remove room</button>
                            <button type="button" class="btn btn-success" @click="joinRoom(room)">Join room</button>
                            <button type="button" class="btn btn-warning" @click="leaveRoom(room)">Leave room</button>
                        </div>
                    </a>
                </div>
             </div>
        </div>

        <div class="col-md-9 current-chat">
            
            <!-- Action Buttons -->
            <div class="row chat-toolbar-row">
                <div class="col-sm-12">
                    <div class="btn-group chat-toolbar" role="group" aria-label="...">
                        <button id="chat-invite" class="btn btn-default ticket-option" type="button" @click="toggleCreateRoom">
                          <i class="glyphicon glyphicon-plus"></i> Create Room
                        </button>

                    </div>
                </div>

                <!-- Create Room Form -->
                <div class="col-sm-12" v-if="newRoom.toggled">
                    <div class="input-group">
                        <label>Name: </label>
                        <input type="text" class="form-control" v-model="newRoom.name">
                    </div>
                    <div class="input-group">
                        <label>Status: </label>
                        <input type="text" class="form-control" v-model="newRoom.status">
                    </div>
                    <div class="input-group">
                        <label>Private: </label>
                        <input type="text" class="form-control" v-model="newRoom.private">
                    </div>
                    <div class="input-group">
                        <label>Max amount of people: </label>
                        <input type="text" class="form-control" v-model="newRoom.peopleLimit">
                    </div>
                    <button @click="createRoom">Create Room</button>
                    <button @click="resetNewRoom">Reset From</button>
                </div>

            </div>

            <!-- Messages -->
            <div class="row current-chat-area">

                <div class="col-md-12" v-if="activeRoom">
                    <h4>Room: {{ activeRoom.name }}</h4>
                    <ul class="media-list">
                        <li class="media" v-bind:key="index" v-for="(message, index) in roomChatHistories[activeRoom._id]">
                            <div class="media-body">
                                
                                <div class="media">
                                    <a class="pull-left" href="#">
                                        <img class="media-object img-circle " src="https://app.teamsupport.com/dc/1078/UserAvatar/1839999/48/1470773165634">
                                    </a>
                                    <div class="media-body">
                                        {{ message.body }}
                                        <br>
                                       <small class="text-muted"> {{ message.sender.username }} | {{ message.time }}</small>
                                        <hr>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul> 
                </div>

                <div class="col-md-12" v-if="activeWhisper">
                    <h4>Chatting with {{ activeWhisper.username }}</h4>
                     <ul class="media-list">
                        <li class="media" v-bind:key="index" v-for="(message, index) in whisperChatHistoryFiltered">
                            <div class="media-body">
                                
                                <div class="media">
                                    <a class="pull-left" href="#">
                                        <img class="media-object img-circle " src="https://app.teamsupport.com/dc/1078/UserAvatar/1839999/48/1470773165634">
                                    </a>
                                    <div class="media-body">
                                        {{ message.body }}
                                        <br>
                                       <small class="text-muted"> {{ message.sender.username }} | {{ message.time }}</small>
                                        <hr>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>

                </div>
            </div>
            <!-- Chatt input and Send button -->
            <div class="row current-chat-footer">
                <div class="panel-footer">
                    <div class="input-group">
                      <input type="text" class="form-control"  @keyup.enter="sendMessage" v-model="messageInput">
                      <span class="input-group-btn">
                        <button class="btn btn-default" type="button" @click="sendMessage">Send</button>
                      </span>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>
</template>

<script>
    import { mapMutations, mapActions, mapGetters, mapState } from 'vuex'

    export default {
        data() {
            return {
                publicRooms: [],
                ownedRooms: [],
                onlineUsers: [],
                activeRoom: null,
                activeWhisper: null,
                roomChatHistories: {},
                whisperChatHistory: [],
                messageInput: '',
                newRoom: {
                    toggled: false,
                    name: '',
                    status: '',
                    private: true,
                    peopleLimit: 0
                },
                message: ''

            }
        },
        computed: {
            ...mapState({
                user: state => state.auth.user,
                authenticated: state => state.auth.authenticated
            }),
            whisperChatHistoryFiltered(){
                let _this = this
                return this.whisperChatHistory.filter(function (message) {
                    return (message.recipient._id === _this.activeWhisper._id && message.sender._id === _this.user._id) || (message.recipient._id === _this.user._id && message.sender._id === _this.activeWhisper._id)
                })
            }
        },
        methods: {
            sendMessage(){
                if(this.activeRoom && !this.activeWhisper) {
                    this.sock("chat").emit("sendInRoom", {
                        room: this.activeRoom,
                        message: {
                            sender: this.user._id,
                            body: this.messageInput,
                        }
                    })
                }if(this.activeWhisper && !this.activeRoom) {
                    this.sock("chat").emit("sendToUser", {
                        recipient: this.activeWhisper._id,
                        sender: this.user._id,
                        body: this.messageInput,
                    })
                }
                this.messageInput = ''
            },
            joinRoom(room) {
                this.sock("chat").emit("joinRoom", room)
            },
            leaveRoom(room){
                this.sock("chat").emit("leaveRoom", room)
            },
            createRoom() {
                this.sock("chat").emit("createRoom", {
                    name: this.newRoom.name,
                    status: this.newRoom.status,
                    private: this.newRoom.private,
                    peopleLimit: this.newRoom.peopleLimit,
                })
            },
            removeRoom(room) {
                this.sock("chat").emit('removeRoom', room)
            },
            toggleWhisper(user) {
                this.activeRoom = null
                this.activeWhisper = user
            },
            toggleRoom(room) {
                this.activeWhisper = null
                this.activeRoom = room
            },
            toggleCreateRoom() {
                this.newRoom.toggled = !this.newRoom.toggled
            },
            resetNewRoom() {
                this.newRoom.name = ''
                this.newRoom.status = ''
                this.newRoom.private = true
                this.newRoom.peopleLimit = 0
            },

            /* HELPERS */
            flashMessage(message){
                this.message = message;
                setTimeout(() => { this.message = null }, 4000);
            }


        },
        created() { //Vue will run all created() hooks when multiple is defined (remember one is defined via a vue mixin)
            //this.$sockets["chat"].socket.connect()
            console.log('Chat created')
            this.$sockets["root"].socket.emit("hello", "hello from chat component created")
            this.$sockets["chat"].socket.emit("joinChat")
            if(!this.user.username) this.sock("chat").emit("fetchUser")
        },

        //THESE REFER TO SOCKET.IO EVENTS, NOT TO COMPONENTS, ALL THESE LISTENERS IS MENT TO ALTER "STATE OF THIS COMPONENT"
        sockets: {  //this.$options.sockets, used to define arbitrary listeners to be executed on socket.io events
            config: {
                namespace: 'chat'
            },
            update(message){
                console.log("Update: " + message)
            },
            userCameOnline(user) {
                let userInOnlineUsers = this.onlineUsers.find(usr => usr._id === user._id) 
                if(userInOnlineUsers) return
                this.onlineUsers.push(user)
            },
            userWentOffline(user) {

                let indexToDelete = this.onlineUsers.indexOf(function (usr) {
                    return usr._id === user._id
                })

                if(indexToDelete) this.onlineUsers.splice(indexToDelete, 1)

            },
            
            //Associated with joinChat, in chat component created hook.
            publicRooms(publicRooms) {
                this.publicRooms = publicRooms
            },
            ownedRooms(ownedRooms) {
                this.ownedRooms = ownedRooms
            },
            onlineUsers(onlineUsers) {
                this.onlineUsers = onlineUsers
            },
            roomChatHistories(roomChatHistories) {
                //console.log('roomChatHistories: ' + JSON.stringify(roomChatHistories))
                this.roomChatHistories = roomChatHistories
            },
            whisperChatHistory(messages) {
                this.whisperChatHistory = messages
            },
            
            userJoinedRoom(data) { //{ user:, room:, chatHistory: }
                console.log("userJoinedRoom with data:")
                console.log(data)
                let message = ''
                if(data.user._id === this.user._id) {
                    message = 'You joined room: ' + data.room.name

                    //ADD CHATT HISTORY TO THE STATE

                    //this.someObject = Object.assign({}, this.someObject, { a: 1, b: 2 })
                    //this.$set(this.someObject, 'b', 2)
                    let chatHistoryToBeAdded = {}
                    chatHistoryToBeAdded[data.chatHistory.roomId] = data.chatHistory.messages 
                    this.roomChatHistories = Object.assign({}, this.roomChatHistories, chatHistoryToBeAdded)
                } else {
                    message = data.user.username + " joind room: " + data.room.name
                }
                this.flashMessage(message)

                //UPDATE THE ROOM THAT A USER JOINED
                //console.log(data.room.owner._id, this.user._id)
                if(data.room.owner._id === this.user._id) {
                    let indexToUpdate = this.ownedRooms.findIndex(function(room) {
                        return room._id+'' === data.room._id+''   
                    })
                    this.ownedRooms.splice(indexToUpdate, 1, data.room)
                } else {
                    let indexToUpdate = this.publicRooms.findIndex(function(room) {
                        return room._id+'' === data.room._id+''
                    })
                    this.publicRooms.splice(indexToUpdate, 1, data.room)
                }
            },
            userLeftRoom(data) {
                //UPDATE THE ROOM THAT A USER LEFT
                console.log(data)
                if(data.room.owner._id === this.user._id) {
                    let indexToUpdate = this.ownedRooms.findIndex(function(room) {
                        return room._id === data.room._id   

                    })
                    this.ownedRooms.splice(indexToUpdate, 1, data.room)
                } else {
                    let indexToUpdate = this.publicRooms.findIndex(function(room) {
                        return room._id === data.room._id
                    })
                    this.publicRooms.splice(indexToUpdate, 1, data.room)
                }
            },

            messageInRoom(data) {
                console.log('new message: ' + JSON.stringify(data))
                //this.roomChatHistories[data.roomId] undefined!

                this.roomChatHistories[data.roomId].push(data.message)

            },

            newRoom(data) { //{chatHistory: , room: }
                //console.log(data)
                if(data.room.owner._id === this.user._id) {
                    this.ownedRooms.push(data.room)
                } else {
                    this.publicRooms.push(data.room)
                }
            },
            roomRemoved(data) {
                console.log(data.room.owner._id === this.user._id)
                if(data.room.owner._id === this.user._id) {
                    console.log("the user ownes the room that is being removed")
                    let indexToRemove = this.ownedRooms.findIndex(function (rm) {
                        console.log("rm._id, data.room._id, indexOf")
                        return rm._id === data.room._id
                    })
                    if(indexToRemove > -1) this.ownedRooms.splice(indexToRemove, 1)
                    //this.sock("chat").emit('fetchUser') SYSTEM NOT MAINTAINING OWNED ROOMS ATM
                } else {
                    let indexToRemove = this.publicRooms.findIndex(function (rm) {
                        return rm._id === data.room._id
                    })
                    if(indexToRemove > -1) this.publicRooms.splice(indexToRemove, 1)
                }
            },

            newWhisperMessage(message) {
                this.whisperChatHistory.push(message)
                window.scrollTo(0, 100000);
            },

            errorMessage(message){
                console.log("Error: " + message)
                this.flashMessage(message)
            },
            error(error) {
                console.log(error)
            }, 
            connect() {
                this.$sockets["chat"].socket.emit("joinChat")
                if(!this.user.username) this.sock("chat").emit("fetchUser")
            }
        }
    }
              
</script>





