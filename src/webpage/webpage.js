let nextTurnIsX;
let socket;

// all websocket stuff in function - needed for reconnecting
function startWebsocket() {
    socket = new WebSocket("ws://localhost:4200/websocket");
    nextTurnIsX = true;

    // socket opened
    socket.onopen = function () {
        console.log("socket opened");
    };

    // socket messages
    socket.onmessage = function (event) {
        const response = JSON.parse(event.data);
        console.log(response);
        (response.turn) ? enableBoard() : disableBoard();
        switch (response.type) {
            case "update": {
                updateBoard(response.board);
                if (response.matchState === "started") {
                    changeTurn();
                }
                break;
            }
            case "end": {
                displayWin(response.reason);
                socket.close();
                break;
            }
            default: {
                console.log("default");
                break;
            }
        }
    };

    // socket closed
    socket.onclose = function () {
        console.log("socket closed");
    };

    // socket error
    socket.onerror = function () {
        console.log("socket error");
    };
}

startWebsocket()

function changeTurn() {
    document.querySelector(".bg").style.display = "block";
    document.querySelector(".bg").style.left = (nextTurnIsX === true) ? "0" : "85px";
    nextTurnIsX = !nextTurnIsX;
}

// send choice to server
function sendChoice(cellIndex) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            cell: cellIndex
        }));
    }
}

// update board
function updateBoard(board) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cellContent = board[i][j];
            // check if index has content
            if (cellContent) {
                // select cell via cell index xy
                document.querySelector(`.cell[cell-index="${i}${j}"]`).innerText = cellContent;
            }
        }
    }
}

// disable board
function disableBoard() {
    document.getElementsByClassName("main-grid")[0].style.opacity = 0.5;
    cells.forEach(cell => {
        cell.style.cursor = 'not-allowed';
    });
}

function enableBoard() {
    document.getElementsByClassName("main-grid")[0].style.opacity = 1;
    cells.forEach(cell => {
        cell.style.cursor = 'pointer';
    });
}


let cells = document.querySelectorAll(".cell");

function displayWin(reason, board) {
    let endGameMsg;

    switch (reason) {
        case "win": {
            endGameMsg = "VICTORY - you won";
            break;
        }
        case "lose": {
            endGameMsg = "DEFEAT - you lost";
            break;
        }
        case "draw": {
            endGameMsg = "DRAW";
            break;
        }
        case "leave": {
            endGameMsg = "VICTORY - enemy left";
            break;
        }
    }

    document.querySelector("#results").innerHTML = endGameMsg;
    document.querySelector("#play-again").style.display = "inline";
    document.querySelector("#results").style.display = "block";
}

function resetBoard() {
    // clear board
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            document.querySelector(`.cell[cell-index="${i}${j}"]`).innerText = null;
        }
    }
    // hide match results
    document.querySelector("#play-again").style.display = "none";
    document.querySelector("#results").style.display = "none";
}

// await dom content load
document.addEventListener('DOMContentLoaded', function () {
    // play again button
    const playButton = document.getElementById("play-again")
    playButton.addEventListener('click', function () {
        resetBoard();
        startWebsocket();
    });
    // board container for cells
    let board = document.querySelector('.main-grid');
    // event listener for board
    board.addEventListener('click', function (event) {
        // check if cell
        if (event.target.classList.contains('cell')) {
            // get cell index and send to server
            sendChoice(event.target.getAttribute('cell-index'));
        }
    });
});