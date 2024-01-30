export default class Player {
    constructor(client, room) {
        this.client = client;
        this.room = room;
    }
    send(type, data) {
        data.type = type;
        data.time = Date.now();
        this.client.send(JSON.stringify(data));
    }
};