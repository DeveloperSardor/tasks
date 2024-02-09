import { errorMessage } from "../utils/error-message.js";
import { JWT } from "../utils/jwt.js";
import TaskModel from "../schemas/tasks.js";
import UserModel from "../schemas/users.js";
import ChatModel from "../schemas/chats.js";
import fs from 'fs'

export class TaskContr {
  constructor() {}

  static async getTasks(req, res) {
    try {
      const { chat } = req.params;
      const { status } = req.query;
      const findChat = await ChatModel.findById(chat);
      if (findChat == null) {
        throw new Error(`Chat topilmadi!`);
      }
      if (chat) {
        if (status) {
          const task = await TaskModel.find({ chat, status });
          res.send({
            status: 200,
            message: `${status} - holatdagi vazifalar`,
            success: true,
            data: task || [],
          });
        } else {
          const task = await TaskModel.find({ chat });
          res.send({
            status: 200,
            message: "Vazifalar",
            success: true,
            data: task || [],   
          });
        }
      } else {
        throw new Error(`Chat Id yuboring!`);
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async createTask(req, res) {
    try {
        const { token } = req.headers;
        const { id } = JWT.VERIFY(token);
        const checkUser = await UserModel.findById(id);
        if(checkUser.position == 'worker'){
            throw new Error(`Siz ishchi sifatida vazifa qo'sholmaysiz`)
        }
        const file = req.file;
      const { task_title, chat } = req.body;
      if(!file){
        throw new Error(`Vazifa faylini yuboring`)
      }else if(!task_title){
        throw new Error(`Vazifani kiriting`)
      }else if(!chat){
        throw new Error(`Chatni yuboring`)
      }
    const newTask = await TaskModel.create({task_title, task_giver : id, chat, task_file : file.destination + file.originalname, status : "pending"})
    res.send({
        status : 201,
        message : "Vazifa muvofaqqiyatli qo'shildi",
        success : true,
        data : newTask
    })
    } catch (error) {
      res.send(errorMessage(error.message));
    } 
  }

  static async doneTask(req, res){
    try {
        const { token } = req.headers;
        const user_id = JWT.VERIFY(token).id;
        const checkUser = await UserModel.findById(user_id);
        if(checkUser.position != 'worker'){
            throw new Error(`Siz ishchi emassiz!`)
        }
        const { id } = req.params;   
        const checkTask = await TaskModel.findById(id);
        if(!checkTask){
          throw new Error(`Vazifa topilmadi!`)
        }   
        const { answer_title } = req.body;
        const file = req.file;
        if(!id){
            throw new Error(`Vazifa id sini yuboring`)
        }else if(!file){
            throw new Error(`Bajarilgan vazifa faylini jo'nating`)
        }
        const done = await TaskModel.findByIdAndUpdate(id, {answer_file : file.destination + file.originalname, answer_title, status : "done"}, { new : true })
        res.send({
            status : 200,
            message : `Vazifa muvofaqqiyatli yuklandi`,
            success : true,
            data : done
        })
    } catch (error) {
        res.send(errorMessage(error.message))
    }
  }



  static async TaskChecked(req, res) {
    try {
        const { token } = req.headers;
        if(!token){
          throw new Error(`Token yuboring`)
        }
        const user_id = JWT.VERIFY(token).id;
        const { id } = req.params;
        const findTask = await TaskModel.findById(id);
        const taskGiver = await UserModel.findById(findTask.task_giver)
        const checkUser = await UserModel.findById(user_id);
        console.log(checkUser);
        if(checkUser.position == 'worker'){
          throw new Error(`Siz ishchi sifatida vazifani tekshirildi holatiga o'tkaza olmaysiz!`)
        }
        if(checkUser.position != taskGiver.position){
            throw new Error(`Siz faqat o'zingiz yaratgan vazifangizning holatini tekshirildi holatiga o'tkaza olasiz`)
        }
        if (findTask == null) {
            throw new Error(`Vazifa topilmadi`);
      }
      const updated = await TaskModel.findByIdAndUpdate(id, {
        status: "checked",
      });
      res.send({
        status: 200,
        message: `Vazifa tekshirildi holatiga o'tdi`,
        success: true,
        data: updated,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async EditTask(req, res) {
    try {
        const { token } = req.headers;
        const user_id = JWT.VERIFY(token).id;
      const { id } = req.params;
      const findTask = await TaskModel.findById(id);
      const taskGiver = await UserModel.findById(findTask.task_giver)
      const checkUser = await UserModel.findById(user_id)
      if(checkUser.position != taskGiver.position){
        throw new Error(`Siz faqat o'zingiz yaratgan vazifangizni o'zgartira olasiz!`)
      }
      if (findTask == null) {
        throw new Error(`Vazifa topilmadi`);
      }
      const { task_title } = req.body;
      const task_file = req.file;
      if (!task_title && !task_file) {
        throw new Error(`O'zgartirish uchun fayl yoki vazifani yuboring`);
      }
      if(task_file){
        if(findTask.task_file != task_file){
            fs.unlink(findTask.task_file, (err)=>{
                if(err){
                    throw new Error(err)
                }
            })
        }
      }
      const editedTask = await TaskModel.findByIdAndUpdate(id, { task_file : task_file ?  task_file.destination + task_file.originalname : findTask.task_file, task_title }, { new : true });
      res.send({
        status: 200,
        message: "Vazifa muvofaqqiyatli yangilandi",
        success: true,
        data: editedTask,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }


  static async EditAsWorker(req, res) {
    try {
        const { token } = req.headers;
        const user_id = JWT.VERIFY(token).id;
      const { id } = req.params;
      const findTask = await TaskModel.findById(id);
      const checkUser = await UserModel.findById(user_id)
      if(checkUser.position != 'worker'){
        throw new Error(`Siz ishchi emassiz!`)
      }
      if (findTask == null) {
        throw new Error(`Vazifa topilmadi`);
      }
      const { answer_title } = req.body;
      const file = req.file;
      if (!answer_title && !file) {
        throw new Error(`O'zgartirish uchun fayl yoki vazifani yuboring`);
      }
      if(file){
        if(findTask.answer_file != file.destination + file.originalname){
          fs.unlink(findTask.answer_file, (err)=>{
            if(err){
              throw new Error(err)
            }
          })
        }
      }
      const editedTask = await TaskModel.findByIdAndUpdate(id, { answer_file : file ?  file.destination + file.originalname : findTask.task_file, answer_title }, { new : true });
      res.send({
        status: 200,
        message: "Vazifa muvofaqqiyatli yangilandi",
        success: true,
        data: editedTask,
      });
    } catch (error) {  
      res.send(errorMessage(error.message));
    }
  }

  static async DeleteTask(req, res) {
    try {
        const { token } = req.headers;
        const user_id = JWT.VERIFY(token).id;
        console.log(user_id);
        const checkUser = await UserModel.findById(user_id);
      const { id } = req.params;
      const findTask = await TaskModel.findById(id);
      if(!findTask){
        throw new Error(`Vazifa topilmadi!`)
      }
      const taskGiver = await UserModel.findById(findTask.task_giver)
      if(checkUser.position !=taskGiver.position){
        throw new Error(`Siz faqat o'zingiz qo'shgan vazifangizni o'chira olasiz!`)
      }
      if(checkUser.position == 'worker'){
        throw new Error(`Siz ishchi sifatida vazifani o'chira olmaysiz!`)
      }
      if (findTask == null) {
        throw new Error(`Vazifa topilmadi`);
      }
      const deletedTask = await TaskModel.findByIdAndDelete(id);
      res.send({
        status: 200,
        message: "Vazifa muvofaqqiyatli o'chirildi",
        success: true,
        data: deletedTask,
      });
      fs.unlink(findTask.task_file, (err)=>{
        if(err){
            throw new Error(err)
        }
      })
      if(answer_file){
        fs.unlink(findTask.answer_file, (err)=>{
            if(err){
                throw new Error(err)
            }
        })
      }
      fs.unlink(findTask.task_file, (err)=>{
        if(err){
            throw new Error(err)
        }
      })
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }





}
