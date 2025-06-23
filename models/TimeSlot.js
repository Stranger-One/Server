import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  time: {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  task: {
    type: String,
    required: true
  },
});

const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);
export default TimeSlot;