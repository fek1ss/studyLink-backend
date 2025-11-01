
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Uploads directory (project-root/uploads)
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
// Ensure upload directory exists
try {
	fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
	// eslint-disable-next-line no-console
	console.error('Could not create upload directory', err);
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
		const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, name);
	},
});

const fileFilter = (req, file, cb) => {
	const mimetype = file.mimetype;
	const ext = path.extname(file.originalname).toLowerCase();
	if (mimetype === 'application/pdf' || ext === '.pdf') {
		cb(null, true);
	} else {
		cb(new Error('Only PDF files are allowed'));
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
