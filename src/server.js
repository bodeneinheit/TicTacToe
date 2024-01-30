import express from "express";
const app = express();
const port = process.env.PORT || 4200;
import http from "http";
import {WebSocketServer} from "ws";
import Room from "./Room.js";
import Player from "./Player.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// create websocket
const httpServer = http.createServer(app);

// decoder for websocket data
const decoder = new TextDecoder();

// create and start websocket server
httpServer.listen(port, () => {
    console.log(`server listening on port ${port}`);
});

// websocket connection
const wss = new WebSocketServer({server: httpServer, path: "/websocket"});

let allConnectedClients = new WeakMap(); // clientConnection: Player
let rooms = []; // Room Array

wss.on("connection", async (clientConnection) => {
    let newRoom;

    // check for empty room
    for (let room of rooms) {
        if (room.players.length === 1 && room.matchState === "wait") {
            newRoom = room;
            // start match
            newRoom.matchState = "started";
            break;
        }
    }

    // no empty rooms
    if (!newRoom) {
        // create room if no empty room
        newRoom = new Room();
        rooms.push(newRoom);
    }

    // create player
    const newPlayer = new Player(clientConnection, newRoom);
    // add player to room
    newRoom.players.push(newPlayer);
    // create WeakMap entry
    allConnectedClients.set(clientConnection, newPlayer);
    // initial client update
    newRoom.broadcastState();

    // player sends message - process choice
    clientConnection.on("message", async (data) => {
        // decode message
        let decodedData = JSON.parse(decoder.decode(new Uint8Array(data)));
        // data contains cell coords
        if (decodedData) {
            const player = allConnectedClients.get(clientConnection);
            player.room.onMessage(player, decodedData);
        } else {
            console.error("invalid data sent");
        }
    });

    // player disconnects - end game
    clientConnection.on("close", async () => {
        let room = allConnectedClients.get(clientConnection).room;
        room.onClose();
        // remove room from rooms
        rooms = rooms.filter(item => item !== room);
        // remove client
        allConnectedClients.delete(clientConnection);
    });
});

// send page files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webpage/index.html');
});
app.get('/webpage.js', (req, res) => {
    res.sendFile(__dirname + '/webpage/webpage.js');
});
app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/webpage/style.css');
});
app.get('/tictactoe.png', (req, res) => {
    res.sendFile(__dirname + '/webpage/tictactoe.png');
});