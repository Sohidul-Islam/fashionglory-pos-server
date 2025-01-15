const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../entity');


const AuthService = {
    async register(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({ ...userData, password: hashedPassword });
            return { status: 201, data: user };
        } catch (error) {
            return { status: 400, data: { message: error.message, error: 'Registration failed' } };
        }
    },

    async login(email, password) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return { status: 404, data: { error: 'User not found' } };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { status: 401, data: { error: 'Invalid password' } };
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15Day' });
            return { status: 200, data: { user, token } };
        } catch (error) {
            return { status: 400, data: { error: 'Login failed' } };
        }
    },

    async getProfile(email) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return { status: 404, data: { error: 'User not found' } };
            }

            return { status: 200, data: { user } };
        } catch (error) {
            return { status: 400, data: { error: 'Login failed' } };
        }
    },

    async updateProfile(userId, updateData) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return { status: 404, data: { error: 'User not found' } };
            }

            await user.update(updateData);
            return { status: 200, data: user };
        } catch (error) {
            return { status: 400, data: { error: 'Update profile failed' } };
        }
    },
    async authenticate(req, res, next) {
        try {
            // Extract the token from headers or query parameters
            const token = req.headers.authorization?.split(" ")[1] || req.query.token;

            if (!token) {
                return res.status(401).json({ message: "No token provided" });
            }

            // Decode and verify the token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                console.error("Invalid token:", error.message);
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            console.log({ decoded, token, JWT_SECRET: process.env.JWT_SECRET });

            // Find the user by the ID in the decoded token
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Attach the user to the request object for further use
            req.user = user;

            // Continue to the next middleware or route handler
            next();
        } catch (error) {
            console.error("Authentication failed:", error.message);
            res.status(500).json({ message: "Authentication failed" });
        }
    },
    async resetPassword(email, newPassword) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return { status: 404, data: { error: 'User not found' } };
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await user.update({ password: hashedPassword });
            return { status: 200, data: user };
        } catch (error) {
            return { status: 400, data: { error: 'Password reset failed' } };
        }
    }
};

module.exports = AuthService;


