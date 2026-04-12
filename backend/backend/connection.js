//connects to DB mongodb

const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI + '/nagrikconnect', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected to local database: nagrikconnect');
        console.log('📍 Database location: mongodb/data/');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('⚠️  Make sure MongoDB is running! Run: setup-mongodb.bat');
        process.exit(1);
    }
};
module.exports = {connectDB}