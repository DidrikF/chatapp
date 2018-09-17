<template>

<main>
  <aside class="menu">
    <!--
    <div class="heading">
      YOUR ROOMS
    </div>
    <div class="elements">
      <div class="room" v-bind:key="index" v-for="(room, index) in ownedRooms" @click="toggleRoom(room)">
        <img v-bind:src="room.image" alt="Room image not available">
        <div class="name">{{ room.name }}</div>
      </div>     
    </div>
    -->

    <div class="heading">
      ROOMS
    </div>
    <div>
      <div class="element" v-bind:key="index" v-for="(room, index) in rooms" @click="toggleRoom(room)">
        <img v-bind:src="room.image" alt="Room image not available">
        <div class="name">{{ room.name }}</div>
      </div>
    </div>
    <div class="heading">
      CEATE ROOM
    </div>
    <div class="create-room">
      <select name="avatar" id="avatar" v-model="newRoom.image">
        <option value="https://api.adorable.io/avatars/140/abott@adorable.png"><img src="https://api.adorable.io/avatars/140/abott@adorable.png" alt="">Avatar 1</option>
        <option value="https://api.adorable.io/avatars/140/abott@adorable.png"><img src="https://api.adorable.io/avatars/140/abott@adorable.png" alt="">Avatar 2</option>
      </select>
      <input type="text" v-model="newRoom.name" @keyup.enter="createRoom">
      <a class="button" @click="createRoom">Add</a>
    </div>
    
    <div class="heading">
      BOTS
    </div>
    <div class="section">
      <div class="element" v-bind:key="index" v-for="(bot, index) in bots" @click="toggleWhisper(bot)">
        <img v-bind:src="bot.image" alt="No avatar">
        <div class="name">{{ bot.username }}</div>
      </div>
    </div>


    <div class="heading">
      USERS
    </div>
    <div class="section">
      <div class="element" v-bind:key="index" v-for="(user, index) in onlineUsers" @click="toggleWhisper(user)">
        <img v-bind:src="user.image" alt="No avatar">
        <div class="name">{{ user.username }}</div>
      </div>
    </div>

    <div class="options">
      <div class="heading">
        OPTIONS
      </div>
      <div class="option">
        <div class="name"><i class="fas fa-user"></i><span>Your Profile</span></div>
      </div>
      <div class="option">
        <div class="name"><i class="fas fa-sign-out-alt"></i><span>Logout</span></div>
      </div>
    </div>
  </aside>

  <!--  Whisper Chat -->
  <div class="chat">
    <div v-if="activeWhisper">
      <div class="with">
        <img v-bind:src="activeWhisper.image" alt="No image">
        <div class="name">{{ activeWhisper.username }}</div>
      </div>

      <div class="history">
        <div class="message-container" v-bind:key="index" v-for="(message, index) in whisperChatHistory">
          
          <!-- FROM OTHER PARTY -->
          <div class="message-from-other" v-if="message.sender.username !== user.username">
            <div class="message-info">
              <span class="name"><i class="fas fa-circle"></i>{{ message.sender.username }}</span>
              <span class="time">
                {{ message.time }}
              </span>
            </div>
            <div class="message-body">{{ message.body }}</div>
          </div>

          <!-- FROM THIS USER -->
          <div class="message-from-me" v-else>
            <div class="message-info-me">
              <span class="name"><i class="fas fa-circle"></i>{{ message.sender.username }}</span>
              <span class="time">
                {{ message.time }}
              </span>
            </div>
            <div class="message-body">
              {{ message.body }}
            </div>
          </div>  
        </div>
      </div>
    </div>


    <!-- Room chat --> 
    <!-- MISSING ATM -->


    <!-- Common input --> 
    <div class="input">
      <textarea name="message" id="message" placeholder="Type your message..." @keyup.enter="sendMessage" v-model="messageInput"></textarea>
      <a class="button" @click="sendMessage">SEND</a>
    </div>

  </div>

</main>

</template>

<script>
import { mapMutations, mapActions, mapGetters, mapState } from "vuex";
export default {
  data() {
    return {
      rooms: [{
        name: "Gaming",
        image: "https://api.adorable.io/avatars/140/abott@adorable.png",
        owner: "EmilieF"
      },
      {
        name: "Work",
        image: "https://api.adorable.io/avatars/140/abott@adorable.png",
        owner: "DidrikFleich"
      },
      {
        name: "Coding",
        image: "https://api.adorable.io/avatars/140/abott@adorable.png",
        owner: "DidrikFleisch"
      }],
      bots: [
        {
          username: "Ellie",
          image: "https://api.adorable.io/avatars/140/abott@adorable.png"  
        },
        {
          username: "John",
          image: "https://api.adorable.io/avatars/140/abott@adorable.png",
        }
      ],
      onlineUsers: [
        {
          username: "EmilieF",
          image: "https://api.adorable.io/avatars/140/abott@adorable.png"
        }, 
        {
          username: "DidrikF",
          image: "https://api.adorable.io/avatars/140/abott@adorable.png"
        }
      ],
      activeRoom: null,
      activeWhisper: null,

      roomChatHistories: {},
      whisperChatHistory: [
        {
          recipient: "DidrikF",
          sender: "EmilieF",
          body: "Hei på deg!",
          time: new Date()
        },
        {
          recipient: "EmilieF",
          sender: "DidrikF",
          body: "Så hyggelig",
          time: new Date()
        }
      ],

      messageInput: "",
      newRoom: {
        toggled: false,
        name: "",
        image: "",
      },
      message: ""
    };
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      authenticated: state => state.auth.authenticated
    }),
    whisperChatHistoryFiltered() {
      let _this = this;
      return this.whisperChatHistory.filter(function(message) {
        return (
          (message.recipient._id === _this.activeWhisper._id &&
            message.sender._id === _this.user._id) ||
          (message.recipient._id === _this.user._id &&
            message.sender._id === _this.activeWhisper._id)
        );
      });
    }
  },
  methods: {
    sendMessage() {
      if (this.activeRoom && !this.activeWhisper) {
        this.sock("chat").emit("sendInRoom", {
          room: this.activeRoom,
          message: {
            sender: this.user._id,
            body: this.messageInput
          }
        });
      }
      if (this.activeWhisper && !this.activeRoom) {
        this.sock("chat").emit("sendToUser", {
          recipient: this.activeWhisper._id,
          sender: this.user._id,
          body: this.messageInput
        });
      }
      this.messageInput = "";
    },
    joinRoom(room) {
      this.sock("chat").emit("joinRoom", room);
    },
    leaveRoom(room) {
      this.sock("chat").emit("leaveRoom", room);
    },
    createRoom() {
      this.sock("chat").emit("createRoom", {
        name: this.newRoom.name,
        status: this.newRoom.status,
        private: this.newRoom.private,
        peopleLimit: this.newRoom.peopleLimit
      });
    },
    removeRoom(room) {
      this.sock("chat").emit("removeRoom", room);
    },
    toggleWhisper(user) {
      this.activeRoom = null;
      this.activeWhisper = user;
    },
    toggleRoom(room) {
      this.activeWhisper = null;
      this.activeRoom = room;
    },
    toggleCreateRoom() {
      this.newRoom.toggled = !this.newRoom.toggled;
    },
    /* HELPERS */
    flashMessage(message) {
      this.message = message;
      setTimeout(() => {
        this.message = null;
      }, 4000);
    }
  },
  created() {
    //Vue will run all created() hooks when multiple is defined (remember one is defined via a vue mixin)
    this.$sockets["chat"].socket.connect()
    console.log("Chat created");
    this.$sockets["root"].socket.emit(
      "hello",
      "hello from chat component created"
    );
    this.$sockets["chat"].socket.emit("joinChat");
    if (!this.user.username) this.sock("chat").emit("fetchUser");
  },

  //THESE REFER TO SOCKET.IO EVENTS, NOT TO COMPONENTS, ALL THESE LISTENERS IS MENT TO ALTER "STATE OF THIS COMPONENT"
  sockets: {
    //this.$options.sockets, used to define arbitrary listeners to be executed on socket.io events
    config: {
      namespace: "chat"
    },
    update(message) {
      console.log("Update: " + message);
    },
    userCameOnline(user) {
      let userInOnlineUsers = this.onlineUsers.find(
        usr => usr._id === user._id
      );
      if (userInOnlineUsers) return;
      this.onlineUsers.push(user);
    },
    userWentOffline(user) {
      let indexToDelete = this.onlineUsers.indexOf(function(usr) {
        return usr._id === user._id;
      });

      if (indexToDelete) this.onlineUsers.splice(indexToDelete, 1);
    },

    //Associated with joinChat, in chat component created hook.
    publicRooms(publicRooms) {
      this.rooms = [...this.rooms, ...publicRooms];
    },
    ownedRooms(ownedRooms) {
      this.rooms = [...this.rooms, ...ownedRooms];
    },
    onlineUsers(onlineUsers) {
      this.onlineUsers = onlineUsers;
    },
    roomChatHistories(roomChatHistories) {
      //console.log('roomChatHistories: ' + JSON.stringify(roomChatHistories))
      this.roomChatHistories = roomChatHistories;
    },
    whisperChatHistory(messages) {
      this.whisperChatHistory = messages;
    },

    userJoinedRoom(data) {
      //{ user:, room:, chatHistory: }
      console.log("userJoinedRoom with data:");
      console.log(data);
      let message = "";
      if (data.user._id === this.user._id) {
        message = "You joined room: " + data.room.name;

        //ADD CHATT HISTORY TO THE STATE

        //this.someObject = Object.assign({}, this.someObject, { a: 1, b: 2 })
        //this.$set(this.someObject, 'b', 2)
        let chatHistoryToBeAdded = {};
        chatHistoryToBeAdded[data.chatHistory.roomId] =
          data.chatHistory.messages;
        this.roomChatHistories = Object.assign(
          {},
          this.roomChatHistories,
          chatHistoryToBeAdded
        );
      } else {
        message = data.user.username + " joind room: " + data.room.name;
      }
      this.flashMessage(message);

      //UPDATE THE ROOM THAT A USER JOINED
      //console.log(data.room.owner._id, this.user._id)
      if (data.room.owner._id === this.user._id) {
        let indexToUpdate = this.ownedRooms.findIndex(function(room) {
          return room._id + "" === data.room._id + "";
        });
        this.ownedRooms.splice(indexToUpdate, 1, data.room);
      } else {
        let indexToUpdate = this.publicRooms.findIndex(function(room) {
          return room._id + "" === data.room._id + "";
        });
        this.publicRooms.splice(indexToUpdate, 1, data.room);
      }
    },
    userLeftRoom(data) {
      //UPDATE THE ROOM THAT A USER LEFT
      console.log(data);
      if (data.room.owner._id === this.user._id) {
        let indexToUpdate = this.ownedRooms.findIndex(function(room) {
          return room._id === data.room._id;
        });
        this.ownedRooms.splice(indexToUpdate, 1, data.room);
      } else {
        let indexToUpdate = this.publicRooms.findIndex(function(room) {
          return room._id === data.room._id;
        });
        this.publicRooms.splice(indexToUpdate, 1, data.room);
      }
    },

    messageInRoom(data) {
      console.log("new message: " + JSON.stringify(data));
      //this.roomChatHistories[data.roomId] undefined!

      this.roomChatHistories[data.roomId].push(data.message);
    },

    newRoom(data) {
      //{chatHistory: , room: }
      //console.log(data)
      this.rooms.push(data.room)
      /*
      if (data.room.owner._id === this.user._id) {
        this.ownedRooms.push(data.room);
      } else {
        this.publicRooms.push(data.room);
      }
      */
    },
    roomRemoved(data) {
      let indexToRemove = this.rooms.findIndex(function(room) {
          return room._id === data.room._id;
        });
      if (indexToRemove > -1) this.rooms.splice(indexToRemove, 1)
      /*
      console.log(data.room.owner._id === this.user._id);
      if (data.room.owner._id === this.user._id) {
        console.log("the user ownes the room that is being removed");
        let indexToRemove = this.ownedRooms.findIndex(function(rm) {
          console.log("rm._id, data.room._id, indexOf");
          return rm._id === data.room._id;
        });
        if (indexToRemove > -1) this.ownedRooms.splice(indexToRemove, 1);
        //this.sock("chat").emit('fetchUser') SYSTEM NOT MAINTAINING OWNED ROOMS ATM
      } else {
        let indexToRemove = this.publicRooms.findIndex(function(rm) {
          return rm._id === data.room._id;
        });
        if (indexToRemove > -1) this.publicRooms.splice(indexToRemove, 1);
      }
      */
    },

    newWhisperMessage(message) {
      this.whisperChatHistory.push(message);
      window.scrollTo(0, 100000);
    },

    errorMessage(message) {
      console.log("Error: " + message);
      this.flashMessage(message);
    },
    error(error) {
      console.log(error);
    },
    connect() {
      this.$sockets["chat"].socket.emit("joinChat");
      if (!this.user.username) this.sock("chat").emit("fetchUser");
    }
  }
};
</script>
