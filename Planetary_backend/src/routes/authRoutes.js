import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/userSchema.js'

const router = express.Router()

// --- Helper function to generate JWT ---
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "12h",
    });
};


// Register a new user - /auth/register
router.post('/signup', async (req, res) => {

    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email and password.' });
    }

    // encrypt the password
    const hashedPassword = bcrypt.hashSync(password, 8)

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({ message: 'User with that email already exists.' });
    }

    // save the new user and hashed password to the db
    try {

        const newUser = await User.create({ name, email, password: hashedPassword });
        console.log(email, hashedPassword)
        // create a token
        const token = signToken(newUser._id);
        const userResponse = newUser.toObject();
        // Remove password from output
        delete userResponse.password;
        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: userResponse,
            },
        });
    } catch (err) {
        console.error('Signup error:', err);
        // Handle Mongoose validation errors or other specific errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ status: 'fail', message: errors.join('. ') });
        }
        res.status(500).json({ message: 'Internal server error during signup.', error: err });
    }
})



router.post('/login', async (req, res) => {
    // we get their email, and we look up the password associated with that email in the database
    // but we get it back and see it's encrypted, which means that we cannot compare it to the one the user just used trying to login
    // so what we can to do, is again, one way encrypt the password the user just entered

    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        // if we cannot find a user associated with that username, return out from the function
        if (!user) { return res.status(404).send({ message: "User not found" }) }

        const passwordIsValid = bcrypt.compareSync(password, user.password)
        // if the password does not match, return out of the function
        if (!passwordIsValid) { return res.status(401).send({ message: "Incorrect email or password." }) }
        console.log(user)

        // then we have a successful authentication
        // Generate JWT
        const token = signToken(user._id);

        const userResponse = user.toObject(); // Convert Mongoose document to plain object
        // Remove password from output before sending response
        delete userResponse.password;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: userResponse,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error during login.' });
    }

})


export default router