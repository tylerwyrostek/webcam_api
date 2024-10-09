const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const pg = require('pg');
app.use(express.json());

const { Client, Pool } = pg;
const client = new Client(
	'postgresql://admin:l1uLHfXu1xV1wDosNnLTgFiNqdyiQP5m@dpg-cs02i51u0jms73e0iql0-a.oregon-postgres.render.com/sky_field_db_dev?ssl=true'
);
const pool = new Pool();
app.use(cors());
require('dotenv').config();

io.on('connection', (socket) => {
	console.log('a user connected');

	socket.on('message', (message) => {
		console.log(message);
		io.emit('message', `${socket.id.substr(0, 2)}: ${message}`);
	});
});

server.listen(3000, async () => {
	console.log('listening on *:3000');
	await client.connect();
});

app.post('/rooms', (req, res) => {
	try {
		const request = req.body;
		var room = {
			id: uuidv4(),
			formattype: request.formattype,
			formatname: request.formatname,
			language: request.language,
			ispublic: request.ispublic,
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
		console.log('ROOMS', rooms);
		res.json({ results: rooms });
	} catch (ex) {
		console.error(ex);
	}
});

async function createRoom(room) {
	try {
		console.log(room);
		await client.query(
			'insert into rooms (roomId, formatType, formatName, language, isPublic) values ($1, $2, $3, $4, $5)',
			[
				room.id,
				room.formattype,
				room.formatname,
				room.language,
				room.ispublic,
			],
			(err, res) => {
				console.log(err);
			}
		);
	} catch (err) {
		console.error(err);
	}
}

async function getRooms() {
	try {
		const res = await client.query(
			'select * from rooms where active = true and isPublic = true and isFull = false'
		);
		return res.rows;
	} catch (err) {
		console.error(err);
	}
}

async function fillRoom(roomId) {
	try {
		await client.connect((err) => {
			client.query(
				'update rooms set isFull = true where roomId = $1',
				[roomId],
				(err, res) => {
					console.log(err);
				}
			);
		});
	} catch (err) {
		console.error(err);
	}
}

function destroyRoom(roomId) {
	try {
		client.connect((err) => {
			client.query(
				'update rooms set isActive = false where roomId = $1',
				[roomId],
				(err, res) => {
					console.log(err);
				}
			);
		});
	} catch (err) {
		console.error(err);
	}
}
