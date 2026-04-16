const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { setUser, getUser } = require('../authservice');
const { checkLogin } = require('../middlewares/auth');


// ======================= SIGNUP =======================
router.post('/signup', async (req, res) => {
    try {
        // ✅ ASYNC HASH
        const hashPassword = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
            gender: req.body.gender,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city || 'Not Specified',
            state: req.body.state,
            pincode: req.body.pincode
        });

        // ✅ REMOVE PASSWORD
        const { password, ...safeUser } = user._doc;

        return res.status(200).json(safeUser);

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(400).json({ message: error.message || "Error creating user" });
    }
});


// ======================= LOGIN =======================
router.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ ASYNC COMPARE
        const validPassword = await bcrypt.compare(req.body.password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        const token = setUser(user);

        // ✅ SECURE COOKIE
        res.cookie("token", token, {
            httpOnly: true,   // 🔥 FIXED
            secure: false,    // set true in production (HTTPS)
            sameSite: "Lax",
            path: "/",
            maxAge: 2 * 60 * 60 * 1000,
        });

        // ✅ REMOVE PASSWORD
        const { password, ...safeUser } = user._doc;

        return res.status(200).json({
            user: safeUser
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
});


// ======================= CHECK AUTH (NEW) =======================
router.get('/check-auth', checkLogin, async (req, res) => {
    try {
        const user = req.user.user;

        if (!user) {
            return res.status(401).json({ isAuthenticated: false });
        }

        // ✅ REMOVE PASSWORD IF EXISTS
        const { password, ...safeUser } = user;

        return res.status(200).json({
            isAuthenticated: true,
            user: safeUser
        });

    } catch (error) {
        return res.status(401).json({ isAuthenticated: false });
    }
});


// ======================= TOKEN DEBUG =======================
router.get('/token/:token', async (req, res) => {
    const token = req.params.token;
    const user = getUser(token);

    if (!user) return res.status(404).json({ message: "Invalid token" });

    const { password, ...safeUser } = user.user;

    return res.json(safeUser);
});


// ======================= LOGOUT =======================
router.get("/logout", async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true, // ✅ FIXED
        secure: false,
        sameSite: "Lax",
        path: "/"
    });

    res.status(200).json({ message: "Logged out successfully" });
});


// ======================= PROFILE UPDATE =======================
router.put("/profileUpdate", checkLogin, async (req, res) => {
    try {
        const userId = req.user.user._id;

        const { name, gender, state, district, pincode, address, mobile } = req.body;

        const updateData = {
            name,
            gender,
            state,
            city: district,
            pincode,
            address,
            phone: mobile
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = setUser(updatedUser);

        res.cookie("token", token, {
            httpOnly: true, // ✅ FIXED
            secure: false,
            sameSite: "Lax",
            path: "/",
        });

        const { password, ...safeUser } = updatedUser._doc;

        return res.status(200).json({
            message: "Profile updated successfully",
            user: safeUser
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});


// ======================= USER INFO =======================
router.get("/username", checkLogin, async (req, res) => {
    const user = req.user.user;

    if (!user) {
        return res.json({ message: "User not found" });
    }

    const { password, ...safeUser } = user;

    return res.json(safeUser);
});

router.get("/profile", checkLogin, async (req, res) => {
    const user = req.user.user;

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const { password, ...safeUser } = user;

    return res.json(safeUser);
});


// ======================= ALL USERS =======================
router.get('/allusers/contact', async (req, res) => {
    const users = await User.find({}).select("-password"); // ✅ FIXED
    return res.json(users);
});


module.exports = router;