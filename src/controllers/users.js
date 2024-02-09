import { errorMessage } from "../utils/error-message.js";
import { JWT } from "../utils/jwt.js";
import sendMail from "../utils/nodemailer.js";
import UserModel from "../schemas/users.js";
import fs from 'fs';
import bcrypt, { hash } from 'bcrypt';

const confirmCode = Math.floor(Math.random() * 9000 + 1000);

export class UsersContr {
  constructor() {}

  static async Register(req, res) {
    try {
      const file = req.file;
      if (file && file.mimetype.split("/")[0] !== "image") {
        throw new Error(`Rasm fayl yuklashingiz kerak!`);
      }
      const { fullname, email, password, position } = req.body;
      if (!fullname) {
        throw new Error(`Ism sharifingizni kiriting!`);
      } else if (!email) {
        throw new Error(`Email talab qilinadi!`);
      } else if (!password) {
        throw new Error(`Iltimos parol yarating!`);
      }else if(!position){
        throw new Error(`Pozitsiyangizni kiriting`)
      }else if(!['worker', 'customer'].includes(position)){
        throw new Error(`You can register only as a worker or customer`)
      }
      const checkEmail = await UserModel.findOne({ email });
      if (checkEmail) {
        throw new Error(`Bu email band!`);
      }
      const newWorker = await UserModel.create({
        fullname,
        email,
        img: file
          ? file.destination  + file.originalname
          : "uploads/user-default.png",
        password,
        position,
      });
      res.send({
        status: 201,
        message: `Muvofaqqiyatli ro'yxatdan o'tdingiz!`,
        success: true,
        data: newWorker,
        token: JWT.SIGN(newWorker?._id),
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }




  static async LoginAsWorkerOrCustomer(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        throw new Error(`Email talab qilinadi!`);
      } else if (!password) {
        throw new Error(`Parolni kiriting!`);
      }
      const worker = await UserModel.findOne({ email });
      const isAvailable = worker && (await worker.matchPassword(password));
      if (!isAvailable) {
        throw new Error(`Foydalanuvchi topilmadi!`);
      }
      await sendMail(email, confirmCode);
      res.send({
        status: 200,
        message: "Emailingiza tasdiqlash kodi yubordik, kodni kiriting!",
        success: true,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async GmailVerification(req, res) {
    try {
      const { code, email } = req.body;
      const findByEmail = await UserModel.findOne({ email });
      if (!findByEmail == null) {
        throw new Error(`Bunday emaildagi foydalanuvchi topilmadi!`);
      }
      if (!code) {
        throw new Error(`Parol jo'nating!`);
      }
      if (code == confirmCode) {
        res.send({
          status: 200,
          message: "Muvofaqqiyatli kirdingiz",
          success: true,
          data: findByEmail,
          token: JWT.SIGN(findByEmail._id),
        });
      } else {
        throw new Error(`Kodni xato kiritdingiz`);
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  //  MANAGER

  static async LoginAsManager(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        throw new Error(`Email talab qilinadi!`);
      } else if (!password) {
        throw new Error(`Parolni kiriting!`);
      }

      const worker = await UserModel.findOne({ email });
      if (worker && (await worker.matchPassword(password))) {
        res.send({
          status: 200,
          message: "Muvofaqqiyatli kirdingiz",
          success: true,
          token: JWT.SIGN(worker._id),
          data: worker,
        });
      } else {
        throw new Error(`Email yoki parol xato`);
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async ForgetPassword(req, res) {
    try {
      const { email } = req.body;
      const findByEmail = await UserModel.findOne({ email });
      if (findByEmail == null) {
        throw new Error(`Foydalanuvchi topilmadi`);
      }
      await sendMail(email, confirmCode);
      res.send({
        status: 200,
        message:
          "Emailingiza tasdiqlash kodi yubordik, kodni kiriting va yangi parol yarating!",
        success: true,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async CreateNewPassAndConfirmationCode(req, res) {
    try {
      const { code, email, password } = req.body;
      const findByEmail = await UserModel.findOne({ email });
      if (!findByEmail == null) {
        throw new Error(`Bunday emaildagi foydalanuvchi topilmadi!`);
      }
      if (!code) {
        throw new Error(`Parol jo'nating!`);
      }
      if (code != confirmCode) {
        throw new Error(`Kodni xato kiritdingiz!`);
      } 
      if (!password) {
        throw new Error(`Parol yarating!`);
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const updatePass = await UserModel.findByIdAndUpdate(
        findByEmail._id,
        { password: hashedPassword },
        { new: true }
      );
      res.send({
        status: 200,
        message: `Parolingiz muvofaqqiyatli o'zgartirildi!`,
        success: true,
        token : JWT.SIGN(updatePass._id),
        data: updatePass,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async GetMyProfile(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      console.log(id);    
      const findProfile = await UserModel.findById(id);
      console.log(findProfile); 
      if (!findProfile ) {
        throw new Error(`Profil topilmadi`);                
      }
      res.send({
        status: 200,
        message: "Profilingiz",
        success: true,
        data: findProfile,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }

  static async GetUsers(req, res) {
    try {
      const search = req.query.search;
      const { id } = req.params;
      if (id) {
        const findById = await UserModel.findById(id);
        if (findById == null) {
          throw new Error(`Foydalanuvchi topilmadi!`);
        } else {
          res.send({
            status: 200,
            message: `${id} - foydalanuvchi ma'lumotlari`,
            success: true,
            data: findById,
          });
        }
      } else if (search) {
        const keyword = req.query.search
          ? {
              $or: [
                { fullname: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
              ],
            }
          : {};
        const users = await UserModel.find(keyword);
        res.send({
          status: 200,
          message: "Qidiruv natijasidagi foydalanuvchilar",
          success: true,
          data: users,
        });
      } else {
        res.send({
          status: 200,
          message: `Barcha foydalanuvchilar`,
          success: true,
          data: await UserModel.find(),
        });
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }



  static async EditMyProfile(req, res) {
    try {
      const { token } = req.headers;
      const { id } = JWT.VERIFY(token);
      const file = req.file;
      const findById = await UserModel.findById(id);
  
      if (findById == null) {     
        throw new Error(`Foydalanuvchi topilmadi`);
      }
  
      const { fullname, email, password } = req.body;
  
      if (!fullname && !email && !password && !file) {
        throw new Error(
          `Siz o'zgartirish uchun hech qanday ma'lumot yubormadingiz!`
        );
      }
  
      if (file && file.mimetype.split("/")[0] !== "image") {
        throw new Error(`Rasm fayl yuklashingiz kerak`);
      }
  
      if (file) {
        if (file !== findById.img) {
          fs.unlink(findById.img, (err) => {
            if (err) {
              throw new Error(err);
            }
          });
        }
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const updated = await UserModel.findByIdAndUpdate(id, {
        fullname,
        email,
        password : hashedPassword,
        img: file
          ? file.destination + file.originalname
          : findById.img + Math.floor(Math.random() * 1000),
      }, { new: true });
  
      res.send({
        status: 200,
        message: `Muvofaqqiyatli o'zgartirildi`,
        success: true,
        data: updated,
      });
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }



  static async DeleteWorkerOrCustomerAsManager(req, res) {
    try {
      const { id } = req.params;
      const findById = await UserModel.findById(id);
      if (findById == null) {
        throw new Error(`Foydalanuvchi topilmadi`);
      }
 
     
      const deletedWorker = await UserModel.findByIdAndDelete(id);
      res.send({
        status: 200,
        message: "Ishchi muvofaqqiyatli o'chirildi",
        success: true,
        data: deletedWorker,
      });
      if(findById.img == 'uploads/user-default.png'){
        return
      }else{
        fs.unlink(findById.img, (err)=>{
          if(err){
            throw new Error(err)
          }
        })
      }
    } catch (error) {
      res.send(errorMessage(error.message));
    }
  }
}
