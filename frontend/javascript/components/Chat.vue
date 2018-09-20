<template>
<div>
<main>
  <aside class="menu">
    <div class="badge">
      <img v-bind:src="user.image" v-if="user" alt="No avatar">
      <div class="name" v-if="user">{{ user.username }}</div>
    </div>
    <div class="scroll-navigation">
      <div class="heading">
        ROOMS
      </div>
      <div>
        <div class="element" v-bind:key="index" v-for="(room, index) in rooms" @click="toggleRoom(room)">
          <img v-bind:src="room.image" alt="Room image not available">
          <div class="name">{{ room.name }}</div>
          <div class="message-count" v-if="roomMessageCounters[room._id]" >{{ roomMessageCounters[room._id] }}</div>
          <a class="leave-room-button" @click.stop="leaveRoom(room)" v-if="room.people.findIndex((person) => {return person._id === user._id}) > -1">Leave</a> <!-- registerButton -->
          <a class="delete-room-button" @click.stop="deleteRoom(room)" v-if="room.owner._id === user._id">Delete</a>
        </div>
      </div>


      <div class="create-room">
        <select class="room-image-select" name="image" id="image" v-model="newRoom.image">
          <option selected disabled>Choose Image</option>
          <option value="images/rooms/pets_dogs_animals.png">Pets, dogs and animals</option>
          <option value="images/rooms/piknik_relax_friends.png">Relaxing, piknik, firends</option>
          <option value="images/rooms/gaming_chill.png">Gaming, Chill</option>
          <option value="images/rooms/motorcycle_road.png">Motorcycle, Road</option>
          <option value="images/rooms/music_violin.png">Music, Playing music</option>
          <option value="images/rooms/painting_creative_work.png">Painting, Creative work</option>
          <option value="images/rooms/work_pc_programming.png">PC, Programming</option>
          <option value="images/rooms/running_sports.png">Running, Sports</option>
        </select>
        <input class="room-name-input" type="text" v-model="newRoom.name" @keyup.enter="createRoom">
        <a class="add-room-button" @click="createRoom">Add</a>
      </div>
      

      <div class="heading">
        USERS
      </div>
      <div class="section">
        <div class="element" v-bind:key="index" v-for="(user, index) in onlineUsers" @click="toggleUser(user)">
          <img v-bind:src="user.image" alt="No avatar">
          <div class="name">{{ user.username }}</div>
          <div class="message-count" v-if="userMessageCounters[user._id]" >{{ userMessageCounters[user._id] }}</div>
        </div>
      </div>

      <div class="options">
        <div class="heading">
          Links
        </div>
        <div class="option" @click="logout">
          <div class="name"><i class="fas fa-sign-out-alt"></i><span>Logout</span></div>
        </div>
        <div class="option" @click="login">
          <div class="name"><i class="fas fa-sign-in-alt"></i><span>Login</span></div>
        </div>
        <div class="option" @click="register">
          <div class="name"><i class="fas fa-user-plus"></i><span>Register</span></div>
        </div>
        <div class="option" @click="home">
          <div class="name"><i class="fas fa-home"></i><span>DidrikFleischer.com</span></div>
        </div>
      </div>
    </div>
    
  </aside>

  <div class="chat">
    
    <!--  Whisper Chat -->
    <slot v-if="toggledUser !== null">

      <div class="with">
        <img v-bind:src="toggledUser.image" alt="No image">
        <div class="name">{{ toggledUser.username }}</div>
      </div>

      <div class="history">
        <slot v-for="(message, index) in whisperChatFiltered">
          <!-- FROM OTHER PARTY -->
          <div class="message-from-other" v-bind:key="index" v-if="message.sender.username !== user.username">
            <div class="message-info">
              <span class="name"><i class="fas fa-circle"></i>{{ message.sender.username }}</span>
              <span class="time">
                {{ message.time }}
              </span>
            </div>
            <div class="message-body">{{ message.body }}</div>
          </div>

          <!-- FROM THIS USER -->
          <div class="message-from-me" v-bind:key="index" v-else>
            <div class="message-info">
              <span class="time">
                {{ message.time }}
              </span>
              <span class="name"><i class="fas fa-circle"></i>{{ message.sender.username }}</span>
            </div>
            <div class="message-body">
              {{ message.body }}
            </div>
          </div>  
        </slot>
      </div>
    </slot>

    <!-- Room chat --> 
    <slot v-else-if="toggledRoom !== null">
      <div class="with">
        <img v-bind:src="toggledRoom.image" alt="No image">
        <div class="name">{{ toggledRoom.name }}</div>
      </div>

      <div class="history">
        <slot v-for="(message, index) in roomChatFiltered">
          
          <!-- FROM OTHER PARTY -->
          <div class="message-from-other" v-bind:key="index" v-if="message.sender.username !== user.username">

            <div class="message-info">
              <span class="name"><i class="fas fa-circle"></i>{{ message.sender.username }}</span>
              <span class="time">
                {{ message.time }}
              </span>
            </div>

            <div class="message-body">
              {{ message.body }}
            </div>

          </div>

          <!-- FROM THIS USER -->
          <div class="message-from-me" v-bind:key="index" v-else>

            <div class="message-info">
              <span class="time">
                {{ message.time }}
              </span>
              <span class="name"><i class="fas fa-circle"></i>{{ message.sender.username }}</span>
            </div>

            <div class="message-body">
              {{ message.body }}
            </div>

          </div>  
        </slot>
      </div>
    </slot>

    <!-- Common input --> 
    <div class="input">
      <textarea name="message" id="message" placeholder="Type your message..." @keyup.enter="sendMessage" v-model="messageInput"></textarea>
      <a class="button" @click="sendMessage">SEND</a>
    </div>
  </div>

</main>

<div class="attribution">
    <a href="http://www.freepik.com">Avatars designed by Freepik</a>
</div>

<slot v-if="notification.length" v-for="(notification, index) in notifications">
  <div class="notification" v-bind:key="index">
    {{ notification }}
  </div>
</slot>
</div>
</template>

<script>

import localforage from 'localforage'
import axios from 'axios'
export default {
  data() {
    return {
      user: null,
      jwt: null,
      roomMessageCounters: {},
      userMessageCounters: {},
      rooms: [],
      onlineUsers: [],
      msgs: [],

      toggledRoom: null,
      toggledUser: null,

      messageInput: "",
      newRoom: {
        name: "",
        image: "",
      },
      notifications: [],
    };
  },

  computed: {
    whisperChatFiltered() {
      return this.msgs.filter((message) => {
        return (
          message.type === 'whisper' && (
            (message.sender._id === this.user._id && message.recipient._id === this.toggledUser._id) ||
            (message.sender._id === this.toggledUser._id && message.recipient._id === this.user._id)
          )
        );
      })
    },
    roomChatFiltered() {
      return this.msgs.filter((message) => {
        return ( message.type === "room" && message.room === this.toggledRoom._id )
      })
    },
  },

  created() {
    Promise.all([
      localforage.getItem('user'), 
      localforage.getItem('jwt')
    ]).then((data) => {
      this.user = data[0]
      this.jwt = data[1]

      this.$sockets["chat"].socket.connect()

      this.$sockets["chat"].socket.emit("joinChat", {jwt: this.jwt});
    }).catch((error) => {
      console.log(error)
    })

  },


  methods: {
    logout () {
      axios.post('/livedemo/chatapp/auth/logout')
      .then((response) => {
        this.user = null
        this.jwt = null
        Promise.all([
          localforage.removeItem('user'), 
          localforage.removeItem('jwt')
        ]).then(() => {
            window.location.replace('/livedemo/chatapp/')
        })
        
      })
      .catch((error) => {
          console.log(error)
      })
    },
    login () {
      window.location.replace('/livedemo/chatapp/login')
    },
    register () {
      window.location.replace('/livedemo/chatapp/')
    },
    home () {
      window.location.replace('/')
    },
    toggleGlobalRoom() {
      const globalRoom = this.rooms.find((room) => {
        return room.name === 'Global'
      })
      this.toggleRoom(globalRoom)
    },
    
    sendMessage() {
      if (this.messageInput.length < 2) return
      if (this.toggledRoom) {
        this.sock("chat").emit("sendInRoom", {
          jwt: this.jwt,
          room: this.toggledRoom,
          message: {
            sender: this.user._id,
            body: this.messageInput,
            type: 'room',
          }
        });
      }
      if (this.toggledUser) {
        this.sock("chat").emit("sendToUser", {
          jwt: this.jwt,
          message: {
            recipient: this.toggledUser._id,
            sender: this.user._id,
            body: this.messageInput,
            type: 'whisper'
          }
        });
      }
      this.messageInput = "";
    },

    // ROOM RELATED METHODS
    joinRoom(room) {
      // console.log('joining room')
      this.sock("chat").emit("joinRoom", {
        jwt: this.jwt,
        room: room
      });
    },
    leaveRoom(room) {
      // console.log("leave Room")
      this.sock("chat").emit("leaveRoom", {
        jwt: this.jwt,
        room: room
      });
    },

    createRoom() {
      this.sock("chat").emit("createRoom", {
        jwt: this.jwt,
        room: {
          name: this.newRoom.name,
          image: this.newRoom.image
        }
      });
    },
    deleteRoom (room) {
      this.sock("chat").emit("deleteRoom", {
        jwt: this.jwt,
        room: room
      });
    },

    // CHANGE CONTEXT METHODS
    toggleUser(user) {
      this.toggledUser = user;
      this.toggledRoom = null;
      this.userMessageCounters[user._id] = 0
      setTimeout(() => {
        var history = document.getElementsByClassName("history")[0];
        history.scrollTop = history.scrollHeight;
      }, 0)
    },
    toggleRoom(room) {
      this.toggledUser = null;
      this.toggledRoom = room;
      this.roomMessageCounters[room._id] = 0
      this.joinRoom(room)
      setTimeout(() => {
        var history = document.getElementsByClassName("history")[0];
        history.scrollTop = history.scrollHeight;
      }, 0)
    },

    flashMessage(notification) {
      this.notifications.push(notification)
      setTimeout(() => {
        this.notifications.shift()
      }, 4000);
    }
  },
  
  sockets: {
    config: {
      namespace: "chat"
    },
    
    userCameOnline(user) {
      //console.log('userCameOnline', user)
      let userInOnlineUsers = this.onlineUsers.find(
        usr => (usr._id === user._id)
      );
      if (userInOnlineUsers || user._id === this.user._id) return;
      this.onlineUsers.push(user);
    },

    userWentOffline(user) {
      //console.log(user, this.onlineUsers)
      let indexToDelete = this.onlineUsers.findIndex(function(usr) {
        return usr._id === user._id;
      });
      //console.log(indexToDelete)
      if (indexToDelete) this.onlineUsers.splice(indexToDelete, 1);
      this.flashMessage(user.username + ' went offline!')
    },


    //Associated with joinChat, in chat component created hook.
    rooms(rooms) {
      //console.log('rooms: ', rooms)
      this.rooms = rooms
      const globalRoom = this.rooms.find((room) => {
        return room.name === 'Global'
      })
      this.toggleRoom(globalRoom)
    },

    onlineUsers2 (onlineUsers) {
      //console.log('OnlineUsers: ', onlineUsers)
      this.onlineUsers = onlineUsers;
    },

    messages(messages) {
      //console.log("it updated")
      //console.log('messages: ', messages)
      this.msgs = messages
    },

    newMessage(message) {
      //console.log("new message: " + JSON.stringify(message));
      this.msgs.push(message)
      setTimeout(() => {
        var history = document.getElementsByClassName("history")[0];
        history.scrollTop = history.scrollHeight;
      }, 0)

      if (message.sender._id === this.user._id) return

      if (message.type === 'whisper') {
        if (!this.userMessageCounters[message.sender._id]) this.userMessageCounters[message.sender._id] = 0
        this.userMessageCounters[message.sender._id]++
      } else {
        //console.log(message.room)
        if (!this.roomMessageCounters[message.room]) this.roomMessageCounters[message.room] = 0
        this.roomMessageCounters[message.room]++
      }

    },


    userJoinedRoom(data) {
      //console.log('userJoinedRoom', data)
      let notification = "";
      if (data.user._id === this.user._id) {
        notification = "You joined room: " + data.room.name;
      
        for (let i = 0; i < data.messages.length; i++) {
          let haveIt = false
          for (let j = 0; j < this.msgs.length; j++) {
            if (this.msgs[j]._id === data.messages[i]._id) {
              haveIt = true
            }
          }
          if (!haveIt) this.msgs.push(data.messages[i])
        }
      } else {
        notification = data.user.username + " joind room: " + data.room.name;
      }

      const indexToUpdate = this.rooms.findIndex((room) => {
        return room._id === data.room._id
      })
      if (indexToUpdate < 0) {
        this.rooms.push(data.room)
      } else {
        this.rooms.splice(indexToUpdate, 1, data.room)
      }

      this.flashMessage(notification);
      setTimeout(() => {
        var history = document.getElementsByClassName("history")[0];
        history.scrollTop = history.scrollHeight;
      }, 0)

    },

    userLeftRoom(data) {
      let indexToUpdate = this.rooms.findIndex(function(room) {
          return room._id === data.room._id;
        });
      this.rooms.splice(indexToUpdate, 1, data.room);
    },

    youLeftRoom (data) {
      let indexToUpdate = this.rooms.findIndex(function(room) {
          return room._id === data.room._id;
        });
      this.rooms.splice(indexToUpdate, 1, data.room);
      this.user = data.user
      if (this.toggledRoom._id === data.room._id) {
        this.toggleGlobalRoom()
      }
    },
  
    newRoom(room) {
      //console.log('new room', room)
      this.rooms.push(room)
      this.newRoom.image = ""
      this.newRoom.name = ""
    },

    
    roomRemoved(room) {
      let indexToRemove = this.rooms.findIndex(function(r) {
          return r._id === room._id;
        });
      if (indexToRemove > -1) this.rooms.splice(indexToRemove, 1)

      if (room._id === this.toggledRoom._id) this.toggleGlobalRoom()
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
    }
  }
};
</script>
