import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import langgraphRoutes from './routes/langgraphRoutes.js'
import authMiddleware from './middleware/middleware.js'

const PORT = process.env.PORT || 3000
const app = express()
app.use(cors())
app.use(express.json())

console.log(process.env.MONGO_URI)

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(`✅ Mongo DB Connected`);
        app.listen(PORT, () => {
            console.log(`🚀 Server at http://localhost:3000`)
        })
    })
    .catch((err) => {
        console.log(`❌ Mongo error: ${err}`)
    })


// All routes in authRoutes will be prefixed with /auth
// All routes in langgraphRoutes will be prefixed with /api
app.use('/auth', authRoutes);
app.use('/api', authMiddleware, langgraphRoutes)


// Basic health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend service is running!' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});