import ChatModel from "../schemas/chats.js";
import UserModel from "../schemas/users.js";
import { errorMessage } from "../utils/error-message.js";
import { JWT } from "../utils/jwt.js";
import fs from 'fs'

export class ChatsContr {
  constructor() {}

  static async accessChat(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      const checkUser = await UserModel.findById(id);
      if(checkUser == null){
        throw new Error(`Token yaroqsiz!`)
      }
      const { user } = req.body;
      if (!user) {
        throw new Error(`user paramterti requestdan yuboring`);
      }
      var isChat = await ChatModel.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq: id } } },
          { users: { $elemMatch: { $eq: user } } },
        ],
      })
        .populate("users", "-password")
        .populate("latestMessage");

      isChat = await UserModel.populate(isChat, {
        path: "latestMessage.sender",
      });

      if (isChat.length > 0) {
        res.send(isChat[0]);
      } else {
        var chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [id, user],
        };
      }

      const createdChat = await ChatModel.create(chatData);
      const FullChat = await ChatModel.findOne({
        _id: createdChat._id,
      }).populate("users");
      res.send({
        chat: 200,
        message: "Chat",
        success: true,
        data: FullChat,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async fetchChats(req, res) {
    try {
      const { token } = req.headers;
      const {id} = JWT.VERIFY(token);
      const checkUser = await UserModel.findById(id);
      if(checkUser == null){
        throw new Error(`Token yaroqsiz!`)
      }
      ChatModel.find({ users: { $elemMatch: { $eq: id } } })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .then(async (results) => {
          results = await UserModel.populate(results, {
            path: "latestMessage.sender",
          });
          res.status(200).send({
            status: 200,
            message: "Chats",
            success: true,
            data: results,
          });
        });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  

  static async createGroupChat(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      const checkUser = await UserModel.findById(id);
  
      if (checkUser == null) {
        throw new Error(`Token yaroqsiz!`);
      }
  
      const file = req.file;
  
      if (!file) {
        throw new Error(`Guruh uchun rasm yuklang`);
      }
  
      if (file && file.mimetype.split('/')[0] != 'image') {
        throw new Error(`Siz faqat rasm yuklay olasiz!`);
      }
  
      const { chatName } = req.body;
  
      if (checkUser.position == 'worker') {
        throw new Error(`Siz ishchi sifatida guruh chati ocholmaysiz!`);
      }
  
      let users = Array.isArray(JSON.parse(req.body.users)) ? JSON.parse(req.body.users) : [];
  
      if (!id || !chatName || users.length === 0) {
        throw new Error("Iltimos barcha kerakli ma'lumotlarni yuboring");
      }
  
      if (users.length < 1) {
        throw new Error(`Chatda kamida ikki kishi bo'lish kerak`);
      }
  
      users.push(id);
  
      const groupChat = await ChatModel.create({
        chatName: req.body.chatName,
        users: users,
        img: file.destination + file.originalname,
        isGroupChat: true,
        groupAdmin: id,
      });
  
      const fullGroupChat = await ChatModel.findOne({ _id: groupChat._id })
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
  
      res.status(200).send({
        status: 200,
        message: "Chat",
        success: true,
        data: fullGroupChat,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }
  



  static async renameGroup(req, res) {
    try {
      const file = req.file;
      if(file && file.mimetype.split('/')[0] != 'image'){
        throw new Error(`Siz faqatgina rasm yuklay olasiz`)
      }
      const { chatName } = req.body;
      const { chatId } = req.params;
      const findById = await ChatModel.findById(chatId);
      if(findById == null){
        throw new Error(`Guruh topilmadi`)
      } 
      
    
      const updatedChat = await ChatModel.findByIdAndUpdate(
        chatId,
        {
          chatName,
          img : file ? file.destination + file.originalname : findById.img
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
      if (!updatedChat) {
        throw new Error(`Chat topilmadi`);
      } else {    
        res.send({
          status: 200,
          message: "Chat o'zgartirildi",
          success: true,
          data: updatedChat,
        });
      }
      if(file){
        fs.unlink(findById.img, (err)=>{
          if(err){
            throw new Error(err)
          }
        })
      }else{
        return
      } 
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async addToGroup(req, res) {
    try {
      const { user, chat } = req.body;
      const added = await ChatModel.findByIdAndUpdate(
        chat,
        {
          $push: { users: user },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!added) {
        throw new Error(`Chat topilmadi!`);
      } else {
        res.send({
          status: 201,
          message: "Chatga yangi a'zo muvofaqqiyatli qo'shildi",
          success: true,
          data: added,
        });
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async removeFromGroup(req, res) {
    try {
      const { user, chat } = req.body;
      const removed = await ChatModel.findByIdAndUpdate(
        chat,
        {
          $pull: { users: user },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!removed) {
        throw new Error(`Chat topilmadi`);
      } else {
        res.send({
          status: 200,
          message: "Guruh a'zosi muvofaqqiyatli o'chirildi",
          success: true,
          data: removed,
        });
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }


  static async deleteChat(req, res){
    try {
      const { id } = req.params;
      const findById = await ChatModel.findById(id);
      if(findById == null){
        throw new Error(`Guruh topilmadi`)
      }
      const deletedChat = await ChatModel.findByIdAndDelete(id);
      res.send({
        status : 200,
        message : "Chatingiz muvofaqqiyatli o'chirildi",
        success : true,
        data : deletedChat
      })   
    } catch (error) {
      res.send(errorMessage(error.message))
    }
  }
}
