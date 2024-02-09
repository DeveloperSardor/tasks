import express from 'express';
import dotenv from 'dotenv'
import http from 'http';
import cors from 'cors'
import { Server as SocketIo } from 'socket.io'
dotenv.config();
import { connectToDb } from '../utils/connect-db.js';
import api from '../routers/index.js'


const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors('*'))
app.use('/uploads',express.static('uploads'))
app.use(express.urlencoded({extended : true}))
app.use('/api', api)


const PORT = process.env.PORT || 3000;

connectToDb();


const io = new SocketIo(server, {
    pingTimeout : 60000,
    cors : {
        origin : "*"
    }
  })


  io.on('connection', socket =>{
    socket.on('setup', (userdata)=>{
        socket.join(userdata?._id)
        socket.emit('connected')
        

        socket.on('join chat', room=>{
            socket.join(room)
            console.log(`User joined Room: ${room}`);
        })

        socket.on('typing', room=> socket.in(room).emit('typing'));
        socket.on('stop typing', room=> socket.in(room).emit('stop typing'))
        
        socket.on('newMessage', (newMessageReceived)=>{
          var chat = newMessageReceived.chat;

          if(!chat.users) return console.log(`chat.users not defined`);
          chat.users.forEach(user=>{
            if(user._id == newMessageReceived.sender._id) return;
            socket.in(user._id).emit('message received', newMessageReceived)
          })
        })

    
        socket.off('setup', ()=>{
            console.log(`User disconnected`);
            socket.leave(userdata._id)
        })

    })
  })



app.listen(PORT, console.log(`Server running on ${PORT} - PORT`))

