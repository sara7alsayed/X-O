const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from the 'public' directory

let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send the current game state to the newly connected player
  socket.emit('gameState', { boardState, currentPlayer, gameActive });

  // Listen for player moves
  socket.on('makeMove', (index) => {
    if (boardState[index] === '' && gameActive) {
      boardState[index] = currentPlayer;

      if (checkWinner()) {
        gameActive = false;
        io.emit('gameOver', { winner: currentPlayer });
      } else if (boardState.every(cell => cell !== '')) {
        gameActive = false;
        io.emit('gameOver', { draw: true });
      } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        io.emit('updateGame', { boardState, currentPlayer });
      }
    }
  });

  // Listen for resets
  socket.on('resetGame', () => {
    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    io.emit('gameState', { boardState, currentPlayer, gameActive });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

function checkWinner() {
  return winningCombinations.some(combination => {
    return combination.every(index => boardState[index] === currentPlayer);
  });
}

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
