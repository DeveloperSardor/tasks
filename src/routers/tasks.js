import { Router } from "express";
import { TaskContr } from "../controllers/tasks.js";
import managerCheck from '../middlewares/manager.js'
import multer from "multer";
import workerCheck from '../middlewares/worker.js'

const router = Router();

const storage = multer.diskStorage({
    destination : function (req, file, cb){
        cb(null, 'uploads/')
    },
    filename : function (req, file, cb){
        cb(null, file.originalname)
    }
})


const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('application/zip')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a ZIP file.'), false);
    }
  };
  

const upload = multer({ storage : storage, fileFilter })

router.get(`/:chat`, TaskContr.getTasks)
router.post(`/`, upload.single('file'), TaskContr.createTask)
router.put(`/done-task/:id`, upload.single('file'), TaskContr.doneTask)
router.put(`/checked-task/:id`, TaskContr.TaskChecked)
router.put(`/edit_for_giver_task/:id`, upload.single('file'),TaskContr.EditTask)
router.put(`/edit_for_worker/:id`, upload.single('file'), TaskContr.EditAsWorker)
router.delete(`/:id`, TaskContr.DeleteTask)

export default router;