const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { setUser, getUser } = require('../authservice');
const { checkLogin } = require('../middlewares/auth');
router.post('/signup', async (req, res)=>{
    try {
        const hashPassword = bcrypt.hashSync(req.body.password, 10);
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
        return res.status(200).json(user);
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(400).json({ message: error.message || "Error creating user" });
    }
})
router.post('/login', async (req, res)=>{
    const email = req.body.email;
    const user = await User.findOne({email});
    if(!user){
        return res.status(404).json({message: "User not found"});
    }
    const validPassword = bcrypt.compareSync(req.body.password, user.password);
    if(!validPassword){
        return res.status(401).json({message: "Invalid Password"});
    }
    const token =  setUser(user);
    res.cookie("token", token, {
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
        path: "/",
        maxAge: 2 * 60 * 60 * 1000,
    });
    return res.status(200).json({token});
})
router.get('/token/:token', async (req, res)=>{
    const token = req.params.token;
    const user = getUser(token);
    return res.json(user.user);
})
router.get("/logout", async (req, res)=>{
    res.clearCookie("token", {
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
        path: "/"
    });
    res.status(200).json({ message: "Logged out successfully" });
})
router.put("/profileUpdate", checkLogin, async (req, res) => {
    try {
        const userId = req.user.user._id;
        const { name, gender, state, district, pincode, address, mobile } = req.body;
        
        // Map district to city as the schema uses city but frontend sends district
        const updateData = { 
            name, 
            gender, 
            state, 
            city: district, // Mapping
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
            console.log("User not found!");
            return res.status(404).json({ message: "User not found" });
        }
        
        const token = setUser(updatedUser);
        res.cookie("token", token, {
            httpOnly: false,
            secure: false,
            sameSite: "Lax",
            path: "/",
        });
        
        console.log("Updated User:", updatedUser);
        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});
router.get("/username", checkLogin, async (req, res)=>{
    const user = req.user.user;
    if(!user){
        return res.json({message: "User not found"});
    }
    return res.json(user);
})
router.get("/profile", checkLogin, async (req, res)=>{
    const user = req.user.user;
    if(!user){
        return res.status(404).json({message: "User not found"});
    }
    return res.json(user);
})
router.get('/allusers/contact', async (req, res)=>{
    const users = await User.find({});
    return res.json(users);
})
module.exports = router;