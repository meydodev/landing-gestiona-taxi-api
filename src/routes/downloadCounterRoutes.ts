import { Router } from 'express';
import {
  getDownloadCounters,
  addDownload,
} from '../controllers/downloadCounterController';

const router = Router();

router.get('/', getDownloadCounters);

router.post('/', addDownload);


export default router;