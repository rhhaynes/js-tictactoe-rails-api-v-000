//== Globals ===================================================================

window.state = Array(9).fill('');
window.turn  = 0;

//== Game Board ================================================================

$(function(){
  $('td').on('click', function(e){
    e.preventDefault();
    if (!!$(this).text()){
      setMessage('Position is already taken. Please make another selection.');
    } else {
      setMessage('');
      doTurn(this);
    }
  });
});

//== Buttons ===================================================================

$(function(){
  $('button#clear').on('click', function(e){
    e.preventDefault();
    resetBoard();
  });
});

$(function(){
  $('button#save').on('click', function(e){
    e.preventDefault();
    saveBoard();
  });
});

$(function(){
  $('button#previous').on('click', function(e){
    e.preventDefault();
    $.get('/games', function(data){
      let gameList = '';
      data.data.forEach(function(game){
        gameList += `<button class="previous" data-id="${game.id}">Game ${game.id}</button><br/>`
      });
      insertGameButtons(gameList, attachListeners);
    });
  });
});

function insertGameButtons(gameList, attachListeners){
  $('div#games').html(gameList);
  attachListeners();
}

function attachListeners(){
  $('button.previous').on('click', function(e){
    e.preventDefault();
    $.get(`/games/${$(this).data('id')}`, function(data){
      $('div#games').html('');
      window.state = data.data.attributes.state;
      window.turn  = state.join('').split('').length;
      $('table').attr('id', data.data.id);
      setBoard(state);
    });
  });
}

//== Functions =================================================================

function doTurn(td){
  window.turn++; updateState(td);
  if (checkWinner()){
    freezeBoard();
  } else if (turn===9){
    setMessage('Tie game.');
    freezeBoard();
  }
}

function updateState(td){
  $(td).text(player(turn));
  window.state = getState();
}

function player(){
  return ( turn%2===0 ? 'X' : 'O' );
}

function setMessage(msg){
  $('div#message').text(msg);
}

function checkWinner(){
  let status = false;
  const oPos = getState().reduce( (arr,tok,idx) => {if (tok==='O') arr.push(idx); return arr}, []);
  const xPos = getState().reduce( (arr,tok,idx) => {if (tok==='X') arr.push(idx); return arr}, []);
  if (oPos.length >= 3 && !status) status = checkForWin(oPos, 'O');
  if (xPos.length >= 3 && !status) status = checkForWin(xPos, 'X');
  return status;
}

function checkForWin(playerPos, playerTok){
  let status = false;
  const winningCombos = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ];
  winningCombos.forEach(function(win){
    if ( win.filter(pos => -1 !== playerPos.indexOf(pos)).length === 3 ) status = true;
  });
  if (status) setMessage(`Player ${playerTok} Won!`);
  return status;
}

//== Helpers ===================================================================

function resetGlobals(){
  window.state = Array(9).fill('');
  window.turn  = 0;
}

function getState(){
  const arr = [];
  for (let y=0; y<3; y++){
    for (let x=0; x<3; x++){
      arr.push($(`td[data-x=${x}][data-y=${y}]`).text());
    }
  }
  return arr;
}

function setBoard(arr){
  for (let y=0; y<3; y++){
    for (let x=0; x<3; x++){
      $(`td[data-x=${x}][data-y=${y}]`).text(arr[y*3+x]);
    }
  }
}

function freezeBoard(){
  setBoard( getState().reduce( (arr,el) => {if (!el) el = ' '; arr.push(el); return arr}, []) );
  saveBoard();
  resetBoard();
}

function resetBoard(){
  $('table').attr('id', '');
  resetGlobals();
  setMessage('');
  setBoard(state);
}

function saveBoard(){
  const gameId = $('table').attr('id');
  if (!!gameId){
    $.ajax({
      method: "PATCH",
      url: `/games/${gameId}`,
      data: {'state': getState()}
    });
  } else {
    $.post('/games', {'state': getState()}, function(data){
      $('table').attr('id', data.data.id);
    });
  }
}
