import mongoose from "mongoose";


const daySlotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    timeSlots: [
        {
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
                required: true,
            },
            status: {
                type: String,
                enum: ["Done", "Undone", "Available"],
                default: "Available",
            },
            note: {
                type: String,
                default: "",
            }
        },
    ],
});

const DaySlot = mongoose.model("DaySlot", daySlotSchema)
export default DaySlot;