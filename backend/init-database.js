require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Grievance = require('./models/grievance');

const initDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI + '/nagrikconnect');
        console.log('✅ Connected to MongoDB successfully!');
        console.log('📊 Database: nagrikconnect');
        console.log('📍 Location: mongodb/data/\n');

        console.log('🔧 Creating database indexes...');
        await User.createIndexes();
        await Grievance.createIndexes();
        console.log('✅ Indexes created successfully!\n');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Collections in database:');
        if (collections.length === 0) {
            console.log('   (No collections yet - will be created when you add data)\n');
        } else {
            collections.forEach(col => console.log(`   - ${col.name}`));
            console.log('');
        }

        const userCount = await User.countDocuments();
        const grievanceCount = await Grievance.countDocuments();
        console.log('📈 Current data:');
        console.log(`   Users: ${userCount}`);
        console.log(`   Grievances: ${grievanceCount}\n`);

        console.log('✅ Database initialization complete!');
        console.log('🚀 You can now start the backend server with: npm start\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        console.error('\n⚠️  Make sure MongoDB is running!');
        console.error('   Run: setup-mongodb.bat\n');
        process.exit(1);
    }
};

initDatabase();