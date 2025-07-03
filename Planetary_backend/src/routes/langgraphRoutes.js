import express from 'express'
import axios from 'axios'
import Planner from '../models/plannerSchema.js'
import User from '../models/userSchema.js'

const router = express.Router()
// const LANGGRAPH_SERVICE_URL = process.env.LANGGRAPH_SERVICE_URL || 'http://localhost:8003';
const LANGGRAPH_SERVICE_INTERNAL_URL = process.env.LANGGRAPH_SERVICE_INTERNAL_URL || 'http://langgraph_service:8003'; // Define it or fetch from env


router.post('/roadmap', async (req, res) => {
    const userId = req.userId
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required.' });
    }

    if (!userId) {
        return res.status(401).json({ status: 'fail', message: 'User ID is required for saving the plan.' });
    }

    // Validate if userId exists in your database - just in case
    try {
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ status: 'fail', message: 'Provided User ID does not exist.' });
        }
    } catch (dbError) {
        console.error('[LangGraph Proxy] Error validating userId:', dbError);
        return res.status(500).json({ status: 'error', message: 'Database error during user validation.' });
    }

    console.log(`[LangGraph Proxy] Received query: "${query}" for userId: "${userId}"`);


    try {

        const langGraphResponse = await axios.post(`${LANGGRAPH_SERVICE_INTERNAL_URL}/plan`, {
            query: query
        });
        console.log(langGraphResponse)

        const llmGeneratedPlan = langGraphResponse.data.final_answer;

        if (!llmGeneratedPlan || !Array.isArray(llmGeneratedPlan.task_list) || llmGeneratedPlan.task_list.length === 0) {
            return res.status(500).json({
                status: 'error',
                message: 'LangGraph did not return a valid roadmap.',
                details: llmGeneratedPlan || 'No data received'
            });
        }

        const mappedTasks = llmGeneratedPlan.task_list.map(llmTask => ({
            title: llmTask.task_title,
            task_description: llmTask.task_description,
            sub_tasks: llmTask.sub_tasks.map(llmSubTask => ({
                action_title: llmSubTask.action_title,
                action_description: llmSubTask.action_description,
                completed: false
            })),
            completed: false
        }));


        const newPlannerDocument = new Planner({
            userId: userId,
            title: llmGeneratedPlan.title,
            description: llmGeneratedPlan.description,
            tasks_list: mappedTasks,
            originalPrompt: query,
        });
        const savedPlan = await newPlannerDocument.save();
        console.log(`[LangGraph Proxy] Plan saved to DB with ID: ${savedPlan._id}`);


        res.status(200).json({
            status: 'success',
            message: 'Roadmap generated and saved successfully!',
            data: {
                plans: [
                    {
                        _id: savedPlan._id,
                        userId: savedPlan.userId,
                        title: savedPlan.title,
                        description: savedPlan.description,
                        tasks_list: savedPlan.tasks_list,
                        originalPrompt: savedPlan.originalPrompt,
                        createdAt: savedPlan.createdAt,
                        updatedAt: savedPlan.updatedAt,
                        __v: savedPlan.__v
                    }
                ]
            },
        });

    } catch (error) {
        console.error('Error generating roadmap:', error.message);
        if (error.response) {
            console.error('LangGraph service error response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to generate roadmap.', details: error.message });
    }
});

// Endpoints for Managing Saved Plans (CRUD Operations)
// GET /api/roadmaps: Get all plans for the authenticated user
router.get('/roadmaps', async (req, res) => {
    try {
        const userId = req.userId;
        // Find all plans belonging to this user, sorted by creation date (newest first)
        const plans = await Planner.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: plans.length,
            data: { plans }
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plans.', details: error.message });
    }
});

// GET /api/roadmaps/:id: Get a specific plan by ID for the authenticated user
router.get('/roadmaps/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const planId = req.params.id;

        // Find the plan by its ID AND ensure it belongs to the authenticated user
        const plan = await Planner.findOne({ _id: planId, userId: userId });

        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Plan not found or does not belong to this user.' });
        }

        res.status(200).json({ status: 'success', data: { plan } });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid plan ID format.' });
        }
        console.error('Error fetching plan by ID:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plan.', details: error.message });
    }
});


// PUT /api/roadmaps/:id: Update a specific plan for the authenticated user
router.put('/roadmaps/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const planId = req.params.id;

        // Uupdate the whole document structure that matches PlannerSchema
        const { title, description, tasks_list, originalPrompt } = req.body;

        // Find the plan by its ID AND ensure it belongs to the authenticated user
        const updatedPlan = await Planner.findOneAndUpdate(
            { _id: planId, userId: userId },
            { title, description, tasks_list, originalPrompt },
            { new: true, runValidators: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({ status: 'fail', message: 'Plan not found or does not belong to this user.' });
        }

        res.status(200).json({ status: 'success', message: 'Plan updated successfully!', data: { plan: updatedPlan } });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ status: 'fail', message: error.message, errors: error.errors });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid plan ID format.' });
        }
        console.error('Error updating plan:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update plan.', details: error.message });
    }
});


// DELETE /api/roadmaps/:id: Delete a specific plan for the authenticated user
router.delete('/roadmaps/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const planId = req.params.id;


        const deletedPlan = await Planner.findOneAndDelete({ _id: planId, userId: userId });

        if (!deletedPlan) {
            return res.status(404).json({ status: 'fail', message: 'Plan not found or does not belong to this user.' });
        }

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ status: 'fail', message: 'Invalid plan ID format.' });
        }
        console.error('Error deleting plan:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete plan.', details: error.message });
    }
});

export default router;