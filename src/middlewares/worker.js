import { errorMessage } from "../utils/error-message.js";
import { JWT } from '../utils/jwt.js';
import UserModel from '../schemas/users.js'


export default async (req, res, next)=>{
    try {
        const { token } = req.headers;
        if(!token){
            throw new Error(`Token yuboring1`)
        }
        const { id } = JWT.VERIFY(token);
        const findWorker = await UserModel.findOne({ position : "worker" })
        const check = await UserModel.findById(id);
        if(check == null){
            throw new Error(`Token yaroqsiz!`)
        }
        if(findWorker._id != id){
            throw new Error(`Siz ishchi emassiz!`)
        }else{
            next()
        }
    } catch (error) {
        res.send(errorMessage(error.message))
    }
}