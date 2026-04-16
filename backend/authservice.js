const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// ✅ USE ENV SECRET
const secretkey = process.env.JWT_SECRET;

// ======================= SET USER =======================
function setUser(user) {
    const token = jwt.sign(
        { user }, 
        secretkey,
        { expiresIn: "7d" } // ✅ ADD EXPIRY
    );
    return token;
}

// ======================= GET USER =======================
function getUser(token) {
    if (!token) return null;

    try {
        return jwt.verify(token, secretkey);
    } catch (error) {
        return null; // ✅ prevent crash
    }
}

module.exports = { setUser, getUser };