import { schedule } from "node-cron";
import DaySlot from "../models/DaySlot.js";
import TimeSlot from "../models/TimeSlot.js";

console.log("hello form createsayslot");


// Run at 6 AM every day
schedule("0 6 * * *", async () => {
    const today = new Date(); // "2025-05-20"
    today.setHours(5, 30, 0, 0); // Normalize to 00:00:00

    // Check if a DaySlot already exists for today
    const existing = await DaySlot.findOne({ date: today });
    if (existing) {
        console.log("DaySlot already exists for today.");
        return;
    }

    const timeSlots = await TimeSlot.find();
    const defaultTimeSlots = timeSlots.map((slot) => ({time:slot.time, task: slot.task}));

    console.log("defaultTimeSlots", defaultTimeSlots);

    const newDaySlot = new DaySlot({
        date: today,
        timeSlots: defaultTimeSlots.map((slot) => ({
            time: slot.time,
            task: slot.task,
            status: "Available",
            note: "",
        })),
    });

    await newDaySlot.save();
    console.log("New DaySlot created for", today);
});
