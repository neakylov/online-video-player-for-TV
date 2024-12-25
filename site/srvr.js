const express = require('express');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs')
const multer = require('multer');

const app = express();
const port = 3000;

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'videos')
	},
	filename: (rq, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

const upload = multer({ storage })

const videoFolder = path.join(__dirname, 'videos');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

app.get('/videos', (req, res) => {
	fs.readdir(videoFolder, (err, files) => {
		if (err) {
			return res.status(500).send('Ошибка чтения папки с видео');
		}

		const videoFiles = files.filter(file => file.endsWith('.mp4'));
		const videoLinks = videoFiles.map(file => `<a href="/videos/${file}">${file}`).join('<br>');

		res.send(videoLinks);
	});
});

app.get('/videos/:videoName', (req, res) => {
	const videoPath = path.join(videoFolder, req.params.videoName);
	res.sendFile(videoPath);
});

app.get('/settings', (req, res) => {
	fs.readdir(videoFolder, (err, files) => {
		if (err) {
			return res.status(500).send('Ошибка при чтении папки')
		}

		ejs.renderFile(path.join(__dirname, 'public', 'settings.html'), { files }, (err, html) => {
			if (err) {
				return res.status(500).send('Ошибка при рендеринге HTML.');
			}
			res.send(html)
		});
	});
});

app.post('/upload', upload.array('files', 15), (req, res) => {
	if (!req.files) {
		return res.status(400).send({ message: 'Файлы не загружены!'});
	}
	res.send({
		message: 'Файлы успешно загружены!',
		files: req.files.map(file => ({
			filename: file.filename,
			path: file.path,
		}))
	});
});

app.post('/delete', (req, res) => {
	const { fileName } = req.body;

	if (!fileName) {
		return res.status(400).send({ message: 'Название файла не указано' });
	}
	const filePath = path.join(videoFolder, fileName.trim());
	console.log('filename: ', fileName.trim())
	console.log('videoFolder: ', videoFolder)
	console.log('filePath: ', filePath)

	fs.access(filePath, fs.constants.F_OK, (err) => {
		if (err) {
			return res.status(404).send({ message: 'File not found!' });
		}

		fs.unlink(filePath, (err) => {
			if (err) {
				return res.status(500).send({ message: 'Ошибка при удалении файла.' });
			}

			res.status(200).send({ message: 'Файлы успешно удалены!' })
		});
	});
});

app.listen(port, () => {
	console.log(`Сервер запущен на http://localhost:${port}`);
});