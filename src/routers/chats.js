import { Router } from "express";
import { ChatsContr } from "../controllers/chats.js";
import managerCheck from '../middlewares/manager.js'
import workerCheck from '../middlewares/worker.js'
import multer from "multer";


const router = Router();

const storage = multer.diskStorage({
    destination : function (req, file, cb){
        cb(null, 'uploads/')
    },
    filename : function (req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({ storage : storage })


router.post(`/`, ChatsContr.accessChat);
router.get(`/`, ChatsContr.fetchChats);
router.post(`/group`, upload.single('file'), ChatsContr.createGroupChat);
router.put(`/rename/:chatId`, upload.single('file'), ChatsContr.renameGroup)
router.put(`/group/add-user`, ChatsContr.addToGroup);
router.put(`/group/remove`, ChatsContr.removeFromGroup)
router.delete(`/:id`, ChatsContr.deleteChat)

export default router;