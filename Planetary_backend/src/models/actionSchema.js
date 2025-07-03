// backend/models/actionSchema.js
import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({
    action_title: {
        type: String,
        required: true,
        trim: true,
    },
    action_description: {
        type: String,
        required: true,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
});

export { actionSchema };