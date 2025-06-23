import DaySlot from "../models/DaySlot.js";

export const UpdateDaySlot = async (req, res) => {
  const { date, timeSlots, status, note } = req.body;

  if (!date || !timeSlots) {
    return res.status(400).json({
      success: false,
      message: "Date and time slots are required.",
    });
  }

  // find the day slot by date
  const daySlot = await DaySlot.findOne({ date });

  if (!daySlot) {
    const newDaySlot = new DaySlot({
      date,
      timeSlots: {},
    });
    await newDaySlot.save();

    return res.status(201).json({
      success: true,
      message: "Day slot created successfully.",
      data: newDaySlot,
    });
  } else {
    // Update the existing day slot
    daySlot.timeSlots = [...daySlot.timeSlots, timeSlots];
    await daySlot.save();

    return res.status(200).json({
      success: true,
      message: "Day slot updated successfully.",
      data: daySlot,
    });
  }

  // Assuming you have a DaySlot model imported
};

export const getDaySlotByDate = async (req, res) => {
  try {
    const { date } = req.query; // e.g. '2025-05-20'

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Normalize date to only match the specific day (ignoring time)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const daySlot = await DaySlot.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!daySlot) {
      return res.status(404).json({ message: "No day slot found for this date" });
    }

    res.json(daySlot);
  } catch (error) {
    console.error("Error getting day slot:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getWeeklyDaySlots = async (req, res) => {
  try {
    const { date } = req.query; // optional, e.g. '2025-05-20'
    const baseDate = date ? new Date(date) : new Date();

    // Set to start of the day
    baseDate.setHours(0, 0, 0, 0);

    // Get day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayIndex = baseDate.getDay();

    // Calculate start (Monday) and end (Sunday) of the week
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - ((dayIndex + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklySlots = await DaySlot.find({
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    }).sort({ date: 1 });

    res.json({ week: { start: startOfWeek, end: endOfWeek }, slots: weeklySlots });
  } catch (error) {
    console.error("Error getting weekly slots:", error);
    res.status(500).json({ message: "Server error" });
  }
};