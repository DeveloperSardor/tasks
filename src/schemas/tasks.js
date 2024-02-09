import { Schema, Types, model } from "mongoose";


const TaskSchema = new Schema({
 task_title : {
    type : String,
},
task_file : {
  type : String
},
answer_title : {
  type : String
},
answer_file : {
  type : String,
},
status : {
    type : String,
    enum : ['pending', 'done', 'checked'],
    default : 'pending'
  },
task_giver : {
  type : Types.ObjectId,
  ref : "Users"
},
chat : {
    type :  Types.ObjectId,
    ref : "Chats"
  }
}, {
    timestamps : true
})



export default model('Tasks', TaskSchema)