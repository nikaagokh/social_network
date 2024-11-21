import { Router } from "express";
import chatRouter from './chat.mjs';
import viewRouter from './view.mjs';

const router = Router();
router.use(viewRouter);
router.use('/api/chat', chatRouter);

export default router;
