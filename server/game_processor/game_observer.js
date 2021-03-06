Observe.currentGame = function(callbacks, runCallbacks){
  var gameCursor = Collections.Games.find({completed: false});
  var betsHandle, gameHandle;
  
  if(runCallbacks) _.each(callbacks, function(func){ func(); });


  var observeBets = function(){
    var currentGame = gameCursor.fetch()[0];
    gameCursor.rewind(); //FFFFFFFFFFFFFUUUUUUUUUUUUUUUUUUUUUUUUUUUU

    if(betsHandle) {
      betsHandle.stop();
    }
    
    if(! currentGame) return;

    betsHandle = Collections.Bets.find({gameId: currentGame._id}).observeChanges({ 
      added: callbacks.betUpdate,
      removed: callbacks.betUpdate
    });
  };

  gameHandle = gameCursor.observeChanges({
    added: observeBets
  });

  observeBets();

  return {
    stop: function(){
      betsHandle.stop();
      gameHandle.stop();
    } 
  };
};
