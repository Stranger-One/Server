import mongoose from "mongoose";
import DaySlot from "../models/DaySlot.js";
import TimeSlot from "../models/TimeSlot.js";

export const createTimeSlot = async (req, res) => {
  const { startTime, endTime, task } = req.body;

  try {
    if (!startTime || !endTime || !task) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const timeSlot = new TimeSlot({
      time: {
        start: startTime,
        end: endTime,
      },
      task,
    });
    await timeSlot.save();

    res.status(200).json({
      success: true,
      message: "TimeSlote created successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message || error,
    });
  }
};

export const getTimeSlots = async (_ , res) => {
  try {
    const timeSlots = await TimeSlot.find();
    const times = timeSlots.map((slot) => ({time:slot.time, task: slot.task}));

    res.status(200).json({
      success: true,
    //   timeSlots,
      times,
      message: "TimeSlote fetch successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message || error,
    });
  }
};

export const updateSlotStatusById = async (req, res) => {
  const { timeSlotId } = req.params;
  const { newStatus } = req.body;

  if (!["Done", "Undone"].includes(newStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await DaySlot.updateOne(
      { "timeSlots._id": new mongoose.Types.ObjectId(timeSlotId) },
      {
        $set: {
          "timeSlots.$.status": newStatus,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Time slot not found" });
    }

    res.json({ message: "Time slot status updated successfully." });
  } catch (error) {
    console.error("Error updating time slot:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};