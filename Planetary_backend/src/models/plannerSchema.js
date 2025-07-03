// backend/models/plannerSchema.js
import mongoose from "mongoose";
import { taskSchema } from "./taskSchema.js";

const plannerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: "Give a title here...",
    },
    description: {
        type: String,
        required: true,
        trim: true,
        default: "Give a description here...",
    },
    tasks_list: {
        type: [taskSchema],
        default: [],
    },
    originalPrompt: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true
});

export default mongoose.model("Planner", plannerSchema);