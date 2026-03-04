const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create Cloudinary storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'internship_portal', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'ppt', 'pptx'],
        resource_type: 'auto', // Automatically detect file type
        public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}` // Custom filename
    }
});

module.exports = { cloudinary, storage };
