import { Router } from "express";
import userRouter from './users.js'
import taskRouter from './tasks.js'
import messageRouter from './messages.js'
import chatRouter from './chats.js'


const router = Router();
router.use('/users', userRouter)
router.use('/messages', messageRouter)
router.use('/tasks', taskRouter)
router.use('/chats', chatRouter)




export default router;