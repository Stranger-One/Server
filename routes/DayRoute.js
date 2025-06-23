import express from 'express';
import { getDaySlotByDate, getWeeklyDaySlots, UpdateDaySlot } from '../controllers/DayController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Day Route');
});


router.get('/get-day', getDaySlotByDate);
router.get('/get-week', getWeeklyDaySlots);


router.post('/update', UpdateDaySlot);

export default router;