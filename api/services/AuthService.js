const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../entity');
const EmailService = require('./EmailService');

const AuthService = {
    async register(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({
                ...userData,
                password: hashedPassword,
                accountStatus: 'inactive',
                isVerified: false
            });

            // await EmailService.sendVerificationEmail(user);

            return {
                status: true,
                message: 'Registration successful. Please check your email to verify your account.',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName
                }
            };
        } catch (error) {
            throw error;
        }
    },

    async verifyEmail(token) {
        try {
            const user = await User.findOne({ where: { verificationToken: token } });
            
            if (!user) {
                throw new Error('Invalid verification token');
            }

            await user.update({
                isVerified: true,
                accountStatus: 'active',
                verificationToken: null
            });

            return {
                status: true,
                message: 'Email verified successfully'
            };
        } catch (error) {
            throw error;
        }
    },

    async login(email, password) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }

            // if (!user.isVerified) {
            //     throw new Error('Please verify your email before logging in');
            // }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                return { status: false, message: "Invalid Password", data: null };
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15d' });
            return { status: true, message: "Login successful", data: { user, token } };
        } catch (error) {
            throw error;
        }
    },

    async getProfile(email) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return { status: false, message: "User not found", data: null };
            }

            return { status: true, message: "Profile retrieved successfully", data: user };
        } catch (error) {
            return { status: false, message: "Failed to retrieve profile", data: null, error };
        }
    },

    async updateProfile(userId, updateData) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return { status: false, message: "User not found", data: null, };
            }

            await user.update(updateData);
            return { status: true, message: "Profile updated successfully", data: user };
        } catch (error) {
            return { status: false, message: "Failed to update profile", data: null, error };
        }
    },

    async authenticate(req, res, next) {
        try {
            const token = req.headers.authorization?.split(" ")[1] || req.query.token;

            if (!token) {
                return res.status(401).json({ status: false, message: "No token provided", data: null });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                return res.status(401).json({ status: false, message: "Invalid or expired token", data: null });
            }

            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(404).json({ status: false, message: "User not found", data: null });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ status: false, message: "Authentication failed", data: null, error });
        }
    },

    async resetPassword(email, newPassword) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return { status: false, message: "User not found", data: null };
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await user.update({ password: hashedPassword });
            return { status: true, message: "Password reset successful", data: user };
        } catch (error) {
            return { status: false, message: "Password reset failed", data: null };
        }
    }
};

module.exports = AuthService;


