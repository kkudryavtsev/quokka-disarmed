/*global Meteor, Deps, Collections, Template, $ */

var $betWheel;
var windowLoaded = false; // we really need to find
var templateRendered = false; // a better way of doing this

var timerId;
var evaluateTimer = function(game){
  if (game && game.startedAt) {
    var latencyTestStart = (new Date()).getTime();
    Meteor.call('getServerTime', function(error, serverTime) {
      roundTripLatency = (new Date()).getTime() - latencyTestStart;
      latency = (!isNaN(roundTripLatency/2)) ? (roundTripLatency/2) : 0;
      serverTime = serverTime;
      startTimer(game, serverTime, latency);
    });

  } else { // timer interupted

    if (timerId) {
      $betWheel.wheelBetGraph("killTimer");
      Meteor.clearInterval(timerId);
      timerId = undefined;
    }

  }

};


var startTimer = function(game, serverTime, latency){
  if (!timerId) {
    var processingTime = 500; // awfully high server + client processing time, but it is what it is
    var elapsed = serverTime - game.startedAt + latency/2 + processingTime;
    var timerValue = ((BTO.TIMER_GAME_DURATION - elapsed)/1000).toFixed(1); 
    timerId = Meteor.setInterval(function(){
      $betWheel.wheelBetGraph("redrawTimer", timerValue);
      timerValue = (timerValue - 0.1).toFixed(1);
    }, 100);
  }
};


var betsDep;
var gamesDep;

var initBetWheel = function(){
  if(!$betWheel.data("btoWheelBetGraph")){
    $betWheel.wheelBetGraph();
    
    betsDep && betsDep.stop();
    betsDep = Deps.autorun(function(){
      $betWheel.wheelBetGraph("redraw", Collections.Bets.find().fetch());
    });
    
    gamesDep && gamesDep.stop();
    gamesDep = Deps.autorun(function(){
      // also pickups changes in game state. This is fine and by design as we want to listen to changes to startedAt
      // we could change it to an observer pattern
      evaluateTimer(Collections.Games.findOne({completed: false})); 
    });
  }
};


Template.gameWheel.rendered = function(){
  $betWheel = $(this.find(".bet-wheel"));
  templateRendered = true;
  if(windowLoaded) initBetWheel();
};


$(window).load(function(){
  windowLoaded = true;
  if(templateRendered) initBetWheel();
});


