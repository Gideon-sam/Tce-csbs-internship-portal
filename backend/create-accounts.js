const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const Proctor = require('./models/Proctor');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Atlas');
        console.log('Database:', process.env.MONGO_URI.split('@')[1].split('/')[1].split('?')[0]);

        // Delete existing accounts
        await Admin.deleteMany({});
        await Proctor.deleteMany({});
        console.log('🗑️  Cleared existing admin/proctor accounts');

        // Create Admin
        const admin = await Admin.create({
            email: 'admin@portal.com',
            password: 'adminpassword'
        });
        console.log('✅ Admin created:', admin.email);

        // Create Proctor
        const proctor = await Proctor.create({
            name: 'Dr. Proctor',
            email: 'proctor@portal.com',
            password: 'proctorpassword',
            department: 'CSBS'
        });
        console.log('✅ Proctor created:', proctor.email);

        console.log('\n🎉 SUCCESS! Accounts created in MongoDB Atlas');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Admin Login:');
        console.log('  Email: admin@portal.com');
        console.log('  Password: adminpassword');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Proctor Login:');
        console.log('  Email: proctor@portal.com');
        console.log('  Password: proctorpassword');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        console.error('\nCheck your .env file has the correct MONGO_URI');
        process.exit(1);
    });
