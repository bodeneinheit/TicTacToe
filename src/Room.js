export default class Room {
    constructor() {
        this.players = [];
        this.board = [[], [], []];
        this.turn = 0; // 0 or 1
        this.matchState = "wait";
    }

    broadcastState() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            player.send("update", {
                board: this.board, turn: this.turn === i, matchState: this.matchState
            });
        }
    }

    // implement logic:
    onMessage(player, data) {
        const cell = data.cell;
        if (cell && cell.length === 2) {
            // split string to single coords
            const x = Number(cell.charAt(0));
            const y = Number(cell.charAt(1));

            // check if match over
            if (this.matchState !== "ended") {
                // check for enough players
                if (this.players.length === 2) {
                    // check whose turn
                    if (player.client === this.players[this.turn].client) {
                        // check if cell empty
                        if (!this.board[x][y]) {
                            // switch turns
                            this.turn = (this.turn === 0) ? 1 : 0;
                            // update board
                            this.board[x][y] = (this.turn) === 1 ? "X" : "O";
                            // broadcast state
                            this.broadcastState();
                            // check win
                            if (this.checkWin()) {
                                // winner
                                this.players[this.turn].send("end", {reason: "lose"});
                                // loser
                                this.players[Math.abs(this.turn - 1)].send("end", {reason: "win"});
                                this.onClose();
                            } else if (this.isBoardFull()) {
                                // draw
                                this.broadcastMessage("end", {reason: "draw"});
                                this.onClose();
                            }
                        } else {
                            console.error("field taken");
                        }
                    } else {
                        console.error("not your turn")
                    }
                } else {
                    console.error("not enough players");
                }
            } else {
                console.error("game ended already");
            }
        }
    }

    broadcastMessage(type, msg) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].send(type, msg);
        }
    }

    // returns true false "draw"
    checkWin() {
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] === this.board[i][1] && this.board[i][1] === this.board[i][2]) {
                if (this.board[i][0]) return true;
            }
            if (this.board[0][i] === this.board[1][i] && this.board[1][i] === this.board[2][i]) {

                if (this.board[0][i]) return true;
            }
        }
        if ((this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) || (this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0])) {
            if (this.board[1][1]) return true;
        }
        return false;
    }

    // check if board full
    isBoardFull() {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!this.board[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }


    onClose() {
        // send draw
        for (let i = 0; i < this.players.length; i++) {
            // remove first index, close websocket
            this.players[i]?.send("end", {reason: "leave"});
        }
        // remove players
        for (let i = 0; i < this.players.length; i++) {
            // remove first index, close websocket
            this.players.shift()?.client.close();
        }
    }
}