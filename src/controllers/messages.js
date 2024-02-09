import { errorMessage } from "../utils/error-message.js";
import MessageModel from "../schemas/messages.js";
import ChatModel from "../schemas/chats.js";
import UsersModel from "../schemas/users.js";
import { JWT } from "../utils/jwt.js";
import fs from 'fs'

export class MessageContr {
  constructor() {}

  static async AddMessage(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      const checkUser = await UsersModel.findById(id);
      if(checkUser == null){
        throw new Error(`Yaroqsiz token!`)
      }
      const file = req.file;
      const { message, chat } = req.body;
      if (!chat) {
        throw new Error(`Chat Id yuboring`);
      }
      if (!message && !file) {
        throw new Error(`Fayl yoki yozuvli xabar yuboring!`);
      }
      const findChat = await ChatModel.findById(chat);
      if (findChat == null) {
        throw new Error(`Chat topilmadi`);
      }
      var newMessage = {
        sender: id,
        message,
        chat,
        type_file: file && file.mimetype.split("/")[0],
        file: file.destination + file.originalname,
      };
      var messageData= await MessageModel.create(newMessage);

      messageData = await messageData.populate("sender");
      messageData = await messageData.populate("chat");
      messageData = await UsersModel.populate(messageData, {
        path: "chat.users",
      });
      await ChatModel.findByIdAndUpdate(chat, {
        latestMessage: messageData ? messageData : "File",
      });
      res.send({
        status: 201,
        message: "Xabar muvofaqqiyatli qo'shildi",
        success: true,
        data: messageData,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async GetMessages(req, res) {
    try {
      const { chat } = req.params;
      if (!chat) {
        throw new Error(`Chat Id yuboring!`);
      }
      const messages = await MessageModel.find({ chat })
        .populate("sender")
        .populate("chat");
      res.send({
        status: 200,
        message: "Xabarlar",
        success: true,
        data: messages,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async UpdateMessage(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      const checkUser = await UsersModel.findById(id);
      if(checkUser == null){
        throw new Error(`Yaroqsiz token!`)
      }
      const message_id = req.params.id;
      const { message } = req.body;
      const file = req.file;

      if (!message_id || !message) {
        throw new Error(`Message Id va yangi xabarni yuboring`);
      }

      const existingMessage = await MessageModel.findById(message_id);

      if (!existingMessage) {
        throw new Error(`Xabar topilmadi!`);
      }
      if (String(existingMessage.sender) !== id) {
        throw new Error(
          `Siz faqat o'zingizning xabarlaringizni o'zgartira olsiz`
        );
      }

      if(file){
        fs.unlink(existingMessage.file, (err)=>{
          if(err){
            throw new Error(err)
          }
        })
        existingMessage.file = file.destination + file.originalname
        existingMessage.type_file = file.mimetype.split('/')[0]
      }
      existingMessage.message = message;
      const updatedMessage = await existingMessage.save();

      res.send({
        status: 200,
        message: "Xabar muvofaqqiyatli yangilandi",
        success: true,
        data: updatedMessage,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async DeleteMessage(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      const checkUser = await UsersModel.findById(id);
      if(checkUser == null){
        throw new Error(`Yaroqsiz token!`)
      }
      const message_id = req.params.id;
      if (!message_id) {
        throw new Error(`Message Id yuboring`);
      }
      const existingMessage = await MessageModel.findById(message_id);

      if (!existingMessage) {
        throw new Error(`Xabar topilmadi`);
      }

      if (String(existingMessage.sender) !== id) {
        throw new Error(`Siz faqat o'zingizning xabaringizni o'chira olasiz`);
      }

      const deletedMessage = await MessageModel.findByIdAndDelete(message_id);
      res.send({
        status: 200,
        message: "Xabar muvofaqqiyatli o'chirildi",
        success: true,
        data: deletedMessage,
      });
      fs.unlink(deletedMessage.file, (err)=>{
        if(err){
          throw new Error(err)    
        }
      })
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }
}
