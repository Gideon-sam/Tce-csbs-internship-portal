const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection...');
console.log('MONGO_URI:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@')); // Hide password

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('Error Code:', err.code);
        console.error('\nPossible solutions:');
        console.error('1. Check if your IP is whitelisted in MongoDB Atlas Network Access');
        console.error('2. Verify your username and password are correct');
        console.error('3. Try using a different network (mobile hotspot)');
        console.error('4. Check if your firewall is blocking MongoDB Atlas');
        process.exit(1);
    });
