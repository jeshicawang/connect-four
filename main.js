const reducer = (state, action) => {
  switch (action.type) {
    case 'START_GAME':
      return Object.assign(
        {},
        state,
        { player: 1, waitingPlayer: 2 }
      )
    case 'CHANGE_PLAYER':
      return Object.assign(
        {},
        state,
        { player: state.waitingPlayer, waitingPlayer: state.player }
      )
    case 'ADD_PIECE':
      const [row, col] = action.pos;
      const newBoard = state.board.map((row) => row.slice());
      newBoard[row][col] = state.player;
      return Object.assign(
        {},
        state,
        { board: newBoard }
      )
    case 'DISPLAY_WINNER':
      return Object.assign(
        {},
        state,
        { winner: action.winner, player: null, waitingPlayer: null }
      )
    default:
      return state
  }
}

const initialState = {
  winner: null,
  board: [ [ null, null, null, null, null, null, null ],
           [ null, null, null, null, null, null, null ],
           [ null, null, null, null, null, null, null ],
           [ null, null, null, null, null, null, null ],
           [ null, null, null, null, null, null, null ],
           [ null, null, null, null, null, null, null ] ],
  player: null,
  waitingPlayer: null
}

const store = Redux.createStore(reducer, initialState);

const draw = () => {
  const $winner = document.getElementById('winner');
  if (store.getState().winner) {
    $winner.classList.add('player' + store.getState().winner);
    $winner.classList.remove('hidden');
    document.getElementById('turn').classList.add('hidden');
    return;
  }
  $winner.classList.add('hidden');

  const $board = document.getElementById('board');
  while ($board.firstChild)
    $board.removeChild($board.firstChild);
  store.getState().board.forEach(row => {
    const $row = document.createElement('tr');
    row.forEach(piece => {
      $piece = document.createElement('td');
      if (!piece)
        $piece.className = 'empty';
      else if (piece === 1)
        $piece.className = 'player1';
      else if (piece === 2)
        $piece.className = 'player2';
      $row.appendChild($piece);
    });
    $board.appendChild($row);
  });

  const $player = document.getElementById('player');
  $player.textContent = 'Player ' + store.getState().player;
  $player.className = 'player' + store.getState().player;
};

store.subscribe(draw);

store.dispatch( { type: 'START_GAME' } );

const moves = document.getElementsByClassName('move');

Array.from(document.getElementById('hover').getElementsByClassName('column'))
  .forEach($column => {
    $column.addEventListener('mousemove', showPiece)
    $column.addEventListener('mouseleave', hidePiece)
    $column.addEventListener('mouseup', hidePiece)
    $column.addEventListener('click', dropPiece)
  })

function showPiece(event) {
  moves[event.target.id].classList.add('player' + store.getState().player);
}

function hidePiece(event) {
  moves[event.target.id].classList.remove('player' + store.getState().player);
}

function dropPiece(event) {
  const col = event.target.id;
  const row = getNextPosition(col);
  if (row < 0) return;
  store.dispatch( { type: 'ADD_PIECE', pos: [row, col] } );
  store.dispatch(determineNextAction());
}

function getNextPosition(col) {
  let greatestAvailableRow = -1;
  store.getState().board
    .map(row => row[col])
    .forEach((slot, index) => {
      if (!slot)
        greatestAvailableRow = index;
    });
  return greatestAvailableRow;
}

function determineNextAction() {
  if (winner())
    return { type: 'DISPLAY_WINNER', winner: store.getState().player };
  return { type: 'CHANGE_PLAYER' }
}

function winner() {
  let gameWon = false;
  const board = store.getState().board.map(row =>
    row.map(slot => {
      if (slot === store.getState().player)
        return true;
      return false;
    })
  );
  for (let x1 = 0; x1 < board.length; x1++) {
    for (let y1 = 0; y1 < board[x1].length; y1++) {
      if (!board[x1][y1]) continue;
      const piece = [x1, y1];
      adjacentPieces(board, piece).forEach(([x2, y2]) => {
        const direction = [x2-x1, y2-y1];
        if (fourInARow(board, piece, direction))
          gameWon = true;
      })
    }
  }
  return gameWon;
}

function adjacentPieces(board, pos) {
  const [x1, y1] = pos;
  const adjacentPieces = [];
  for (let x2 = x1-1; x2 <= x1+1; x2++) {
    for (let y2 = y1-1; y2 <= y1+1; y2++) {
      if ( (x2 === x1 && y2 === y1) || x2 < 0 || x2 > 5 || y2 < 0 || y2 > 6 ) continue;
      if (board[x2][y2])
        adjacentPieces.push([x2, y2]);
    }
  }
  return adjacentPieces;
}

function fourInARow(board, piece, direction) {
  let [x, y] = piece;
  const [dx, dy] = direction;
  if (x + 3*dx < 0 || x + 3*dx > 5 || y + 3*dy < 0 || y + 3*dy > 6)
    return false;
  return (board[ x + dx ][ y + dy ] && board[ x + 2*dx ][ y + 2*dy ] && board[ x + 3*dx ][ y + 3*dy ])
}
