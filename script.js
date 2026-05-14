class ConnectFour {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = [];
        this.currentPlayer = 1;
        this.gameActive = true;
        this.difficulty = 'medium';
        this.scores = this.loadScores();
        
        this.initializeBoard();
        this.createBoardUI();
        this.attachEventListeners();
        this.updateScoreDisplay();
    }

    initializeBoard() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    createBoardUI() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }

    attachEventListeners() {
        const board = document.getElementById('board');
        
        // Handle both click and touch events
        const handleCellClick = (e) => {
            if (e.target.classList.contains('cell') && this.gameActive && this.currentPlayer === 1) {
                const col = parseInt(e.target.dataset.col);
                this.makeMove(col);
            }
        };
        
        board.addEventListener('click', handleCellClick);
        board.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleCellClick(e);
        });

        const newGameBtn = document.getElementById('newGame');
        newGameBtn.addEventListener('click', () => this.resetGame());
        newGameBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.resetGame();
        });

        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        const resetBtn = document.getElementById('resetScores');
        resetBtn.addEventListener('click', () => this.resetScores());
        resetBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.resetScores();
        });
    }

    makeMove(col) {
        const row = this.getAvailableRow(col);
        if (row === -1 || !this.gameActive) return false;

        this.board[row][col] = this.currentPlayer;
        this.animatePiece(row, col, this.currentPlayer);
        
        if (this.checkWin(row, col)) {
            this.endGame('win');
            return true;
        }
        
        if (this.checkDraw()) {
            this.endGame('draw');
            return true;
        }

        this.currentPlayer = 3 - this.currentPlayer;
        this.updateStatus();

        if (this.currentPlayer === 2 && this.gameActive) {
            setTimeout(() => this.makeAIMove(), 500);
        }

        return true;
    }

    getAvailableRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1;
    }

    animatePiece(row, col, player) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('occupied', `player${player}`);
        
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            cell.classList.add('drop');
            setTimeout(() => cell.classList.remove('drop'), 500);
        });
    }

    checkWin(row, col, highlightWin = true) {
        const player = this.board[row][col];
        
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];

        for (const [dir1, dir2] of directions) {
            const count = 1 + 
                this.countInDirection(row, col, dir1[0], dir1[1], player) +
                this.countInDirection(row, col, dir2[0], dir2[1], player);
            
            if (count >= 4) {
                if (highlightWin) {
                    this.highlightWinningCells(row, col, dir1, dir2, player);
                }
                return true;
            }
        }

        return false;
    }

    countInDirection(row, col, dRow, dCol, player) {
        let count = 0;
        let r = row + dRow;
        let c = col + dCol;
        
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            count++;
            r += dRow;
            c += dCol;
        }
        
        return count;
    }

    highlightWinningCells(row, col, dir1, dir2, player) {
        const winningCells = [[row, col]];
        
        for (const [dRow, dCol] of [dir1, dir2]) {
            let r = row + dRow;
            let c = col + dCol;
            
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                winningCells.push([r, c]);
                r += dRow;
                c += dCol;
            }
        }

        winningCells.forEach(([r, c]) => {
            document.querySelector(`[data-row="${r}"][data-col="${c}"]`).classList.add('winning');
        });
    }

    checkDraw() {
        return this.board[0].every(cell => cell !== 0);
    }

    makeAIMove() {
        if (!this.gameActive) return;

        let col;
        
        switch (this.difficulty) {
            case 'easy':
                col = this.getRandomMove();
                break;
            case 'medium':
                col = this.getMediumMove();
                break;
            case 'hard':
                col = this.getHardMove();
                break;
        }

        if (col !== -1) {
            this.makeMove(col);
        }
    }

    getRandomMove() {
        const availableCols = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.getAvailableRow(col) !== -1) {
                availableCols.push(col);
            }
        }
        return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    getMediumMove() {
        for (let col = 0; col < this.cols; col++) {
            if (this.canWinNextMove(col, 2)) return col;
        }
        
        for (let col = 0; col < this.cols; col++) {
            if (this.canWinNextMove(col, 1)) return col;
        }
        
        const centerBias = [3, 2, 4, 1, 5, 0, 6];
        for (const col of centerBias) {
            if (this.getAvailableRow(col) !== -1) return col;
        }
        
        return this.getRandomMove();
    }

    getHardMove() {
        const scores = new Array(this.cols).fill(-Infinity);
        
        for (let col = 0; col < this.cols; col++) {
            if (this.getAvailableRow(col) === -1) continue;
            
            const boardCopy = this.copyBoard();
            const row = this.getAvailableRow(col);
            boardCopy[row][col] = 2;
            
            scores[col] = this.minimax(boardCopy, 5, -Infinity, Infinity, false);
        }
        
        let maxScore = Math.max(...scores.filter(s => s !== -Infinity));
        let bestCols = [];
        for (let col = 0; col < this.cols; col++) {
            if (scores[col] === maxScore) bestCols.push(col);
        }
        
        return bestCols[Math.floor(Math.random() * bestCols.length)];
    }

    minimax(board, depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return this.evaluateBoard(board);
        }

        const winner = this.checkBoardWinner(board);
        if (winner === 2) return 1000 + depth;
        if (winner === 1) return -1000 - depth;
        if (this.isBoardFull(board)) return 0;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let col = 0; col < this.cols; col++) {
                const row = this.getAvailableRowForBoard(board, col);
                if (row === -1) continue;
                
                board[row][col] = 2;
                const score = this.minimax(board, depth - 1, alpha, beta, false);
                board[row][col] = 0;
                
                maxEval = Math.max(maxEval, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let col = 0; col < this.cols; col++) {
                const row = this.getAvailableRowForBoard(board, col);
                if (row === -1) continue;
                
                board[row][col] = 1;
                const score = this.minimax(board, depth - 1, alpha, beta, true);
                board[row][col] = 0;
                
                minEval = Math.min(minEval, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluateBoard(board) {
        let score = 0;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (col <= this.cols - 4) {
                    score += this.evaluateLine(
                        board[row][col],
                        board[row][col + 1],
                        board[row][col + 2],
                        board[row][col + 3]
                    );
                }
                
                if (row <= this.rows - 4) {
                    score += this.evaluateLine(
                        board[row][col],
                        board[row + 1][col],
                        board[row + 2][col],
                        board[row + 3][col]
                    );
                }
                
                if (row <= this.rows - 4 && col <= this.cols - 4) {
                    score += this.evaluateLine(
                        board[row][col],
                        board[row + 1][col + 1],
                        board[row + 2][col + 2],
                        board[row + 3][col + 3]
                    );
                }
                
                if (row >= 3 && col <= this.cols - 4) {
                    score += this.evaluateLine(
                        board[row][col],
                        board[row - 1][col + 1],
                        board[row - 2][col + 2],
                        board[row - 3][col + 3]
                    );
                }
            }
        }
        
        return score;
    }

    evaluateLine(a, b, c, d) {
        let score = 0;
        const line = [a, b, c, d];
        const aiCount = line.filter(x => x === 2).length;
        const playerCount = line.filter(x => x === 1).length;
        
        if (aiCount === 3 && playerCount === 0) score += 50;
        else if (aiCount === 2 && playerCount === 0) score += 10;
        else if (aiCount === 1 && playerCount === 0) score += 1;
        else if (playerCount === 3 && aiCount === 0) score -= 50;
        else if (playerCount === 2 && aiCount === 0) score -= 10;
        
        return score;
    }

    canWinNextMove(col, player) {
        const row = this.getAvailableRow(col);
        if (row === -1) return false;
        
        this.board[row][col] = player;
        const wins = this.checkWin(row, col, false);  // Don't highlight during simulation
        this.board[row][col] = 0;
        
        return wins;
    }

    copyBoard() {
        return this.board.map(row => [...row]);
    }

    checkBoardWinner(board) {
        const originalBoard = this.board;
        this.board = board;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (board[row][col] !== 0 && this.checkWin(row, col, false)) {  // Don't highlight during simulation
                    const winner = board[row][col];
                    this.board = originalBoard;
                    return winner;
                }
            }
        }
        
        this.board = originalBoard;
        return 0;
    }

    getAvailableRowForBoard(board, col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (board[row][col] === 0) {
                return row;
            }
        }
        return -1;
    }

    isBoardFull(board) {
        return board[0].every(cell => cell !== 0);
    }

    endGame(result) {
        this.gameActive = false;
        
        if (result === 'win') {
            if (this.currentPlayer === 1) {
                this.scores.wins++;
                this.updateStatus('You win! 🎉');
            } else {
                this.scores.losses++;
                this.updateStatus('AI wins!');
            }
        } else {
            this.scores.draws++;
            this.updateStatus("It's a draw!");
        }
        
        this.saveScores();
        this.updateScoreDisplay();
    }

    resetGame() {
        // Clear any winning highlights
        document.querySelectorAll('.cell.winning').forEach(cell => {
            cell.classList.remove('winning');
        });
        
        this.initializeBoard();
        this.createBoardUI();
        this.currentPlayer = 1;
        this.gameActive = true;
        this.updateStatus();
    }

    updateStatus(message) {
        const status = document.getElementById('gameStatus');
        if (message) {
            status.textContent = message;
        } else {
            status.textContent = this.currentPlayer === 1 ? 'Your turn' : 'AI thinking...';
        }
    }

    loadScores() {
        try {
            const saved = localStorage.getItem('connectFourScores');
            return saved ? JSON.parse(saved) : { wins: 0, losses: 0, draws: 0 };
        } catch (e) {
            // Handle localStorage errors (e.g., private browsing)
            return { wins: 0, losses: 0, draws: 0 };
        }
    }

    saveScores() {
        try {
            localStorage.setItem('connectFourScores', JSON.stringify(this.scores));
        } catch (e) {
            // Silently fail if localStorage is unavailable
            console.warn('Unable to save scores:', e);
        }
    }

    resetScores() {
        this.scores = { wins: 0, losses: 0, draws: 0 };
        this.saveScores();
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.getElementById('wins').textContent = this.scores.wins;
        document.getElementById('losses').textContent = this.scores.losses;
        document.getElementById('draws').textContent = this.scores.draws;
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ConnectFour();
    });
} else {
    // DOM is already ready
    new ConnectFour();
}

// Prevent pinch zoom on iOS
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);
