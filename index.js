const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const { DefaultAzureCredential } = require('@azure/identity');
const sql = require('mssql');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
app.use(express.json());

app.use(cors());
require('dotenv').config();

const pool = new sql.ConnectionPool({
	user: 'admin',
	password: '0518942A!b',
	database: 'webcamtcg_dev',
	server: 'DESKTOP-9ECP87B',
	options: {
		trustedConnection: true,
		trustServerCertificate: true,
	},
});

io.on('connection', (socket) => {
	console.log('a user connected');

	socket.on('message', (message) => {
		console.log(message);
		io.emit('message', `${socket.id.substr(0, 2)}: ${message}`);
	});
});

server.listen(3000, async () => {
	console.log('listening on *:3000');
});

app.post('/rooms', (req, res) => {
	try {
		const request = req.body;
		var room = {
			id: uuidv4(),
			formatType: request.formatType,
			formatName: request.formatName,
			language: request.language,
			isPublic: request.isPublic,
		};

		createRoom(room);

		res.json({ result: room });
	} catch (ex) {
		res.json({ error: ex });
	}
});

app.post('/rooms/fill', (req, res) => {
	try {
		const request = req.body;
		var roomId = request.roomId;

		fillRoom(roomId);

		res.json({ result: 'success!' });
	} catch (ex) {
		res.json({ error: ex });
	}
});

app.post('/rooms/destroy', (req, res) => {
	try {
		const request = req.body;
		var roomId = request.roomId;

		destroyRoom(roomId);

		res.json({ result: 'success!' });
	} catch (ex) {
		res.json({ error: ex });
	}
});

app.get('/rooms', async (req, res) => {
	try {
		const rooms = await getRooms();
		res.json({ results: rooms });
	} catch (ex) {}
});

function createRoom(room) {
	pool.connect()
		.then(() => {
			return pool
				.request()
				.input('id', sql.VarChar, room.id)
				.input(
					'formatType',
					sql.Int,
					room.formatType
				)
				.input(
					'formatName',
					sql.VarChar,
					room.formatName
				)
				.input(
					'language',
					sql.VarChar,
					room.language
				)
				.input(
					'isPublic',
					sql.Bit,
					room.isPublic
				)
				.query(
					'insert into dbo.rooms (roomId, formatType, formatName, language, isPublic) values (@id, @formatType, @formatName, @language, @isPublic)'
				);
		})
		.then((result) => {
			//console.log(result);
			pool.close();
		})
		.catch((err) => {
			console.log(err);
			pool.close();
		});
}

function getRooms() {
	return pool
		.connect()
		.then(() => {
			return pool
				.request()
				.query(
					'select * from dbo.rooms where active = 1 and isPublic = 1 and isFull = 0'
				);
		})
		.then((result) => {
			//console.log(result);

			pool.close();
			return result.recordset;
		})
		.catch((err) => {
			console.log(err);
			pool.close();
		});
}

function fillRoom(roomId) {
	return pool
		.connect()
		.then(() => {
			return pool
				.request()
				.input('id', sql.VarChar, roomId)
				.query(
					'update dbo.rooms set isFull = 1 where roomId = @id'
				);
		})
		.then((result) => {
			//console.log(result);

			pool.close();
			return result.recordset;
		})
		.catch((err) => {
			console.log(err);
			pool.close();
		});
}

function destroyRoom(roomId) {
	return pool
		.connect()
		.then(() => {
			return pool
				.request()
				.input('id', sql.VarChar, roomId)
				.query(
					'update dbo.rooms set isActive = 0 where roomId = @id'
				);
		})
		.then((result) => {
			//console.log(result);

			pool.close();
			return result.recordset;
		})
		.catch((err) => {
			console.log(err);
			pool.close();
		});
}
