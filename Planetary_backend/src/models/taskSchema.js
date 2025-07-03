// backend/models/taskSchema.js
import mongoose from "mongoose";
import { actionSchema } from "./actionSchema.js";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    task_description: {
        type: String,
        required: true,
        trim: true,
        default: "Add a description here..."
    },
    sub_tasks: {
        type: [actionSchema],
        default: [],
    },
    completed: {
        type: Boolean,
        default: false,
    },
    createdAt: { type: Date, default: Date.now }
});

export { taskSchema };