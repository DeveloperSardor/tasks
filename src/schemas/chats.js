import { Schema, Types, model } from "mongoose";


const ChatSchema = new Schema({
chatName : {
    type : String,
    trim : true
},
isGroupChat : {
    type : Boolean,
    default : false
},
users : [{
    type : Types.ObjectId,
    ref : "Users"
}],
latestMessage : {
    type : Types.ObjectId,
    ref : "Messages"
},
img : {
    type : String
},
groupAdmin : {
    type : Types.ObjectId,
    ref : "Users"
}
}, {
    timestamps : true
})

export default model('Chats', ChatSchema)