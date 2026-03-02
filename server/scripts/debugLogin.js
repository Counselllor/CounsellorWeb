require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function debugLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin exists
        const admin = await User.findOne({ username: 'counsellor' });
        if (!admin) {
            console.log('❌ Admin user NOT FOUND');
            await mongoose.connection.close();
            return;
        }

        console.log('\n📋 Admin User Details:');
        console.log('   _id:', admin._id);
        console.log('   username:', admin.username);
        console.log('   email:', admin.email);
        console.log('   role:', admin.role);
        console.log('   password hash:', admin.password ? admin.password.substring(0, 20) + '...' : 'NULL');
        console.log('   password hash length:', admin.password ? admin.password.length : 0);

        // Test password comparison with ADMIN_PASSWORD from env
        const testPassword = process.env.ADMIN_PASSWORD;
        console.log('\n🔐 Testing password from env (ADMIN_PASSWORD):');
        if (!testPassword) {
            console.log('   ❌ ADMIN_PASSWORD not set in .env');
        } else {
            console.log('   Test password:', testPassword);
            const isMatch = await bcrypt.compare(testPassword, admin.password);
            console.log('   Match result:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
debugLogin();
