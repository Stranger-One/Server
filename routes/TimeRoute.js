import express from 'express';
import { createTimeSlot, getTimeSlots, updateSlotStatusById } from '../controllers/TimeController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Time Route');
});


router.get('/get', getTimeSlots)
router.post('/create', createTimeSlot);
router.put('/update/:timeSlotId', updateSlotStatusById);

export default router;