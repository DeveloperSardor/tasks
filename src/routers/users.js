import { Router } from "express";
import { UsersContr } from "../controllers/users.js";
import multer from "multer";
import managerCheck from '../middlewares/manager.js'

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

router.post(`/register`, upload.single('file'), UsersContr.Register);  // For worker and customer
router.post(`/login-worker_customer`, UsersContr.LoginAsWorkerOrCustomer)
router.post(`/login-verification`, UsersContr.GmailVerification)
router.post(`/login-manager`, UsersContr.LoginAsManager)
router.post(`/forget-password`, UsersContr.ForgetPassword)
router.post(`/new-password`, UsersContr.CreateNewPassAndConfirmationCode)
router.get(`/my-profile`, UsersContr.GetMyProfile)
router.get(`/`, UsersContr.GetUsers)
router.get(`/:id`, UsersContr.GetUsers)
router.put(`/my-profile`, upload.single('file'), UsersContr.EditMyProfile)
router.delete(`/delete-worker_customer/:id`, managerCheck,  UsersContr.DeleteWorkerOrCustomerAsManager)


export default router;