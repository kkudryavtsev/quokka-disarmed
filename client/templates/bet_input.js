/*global Deps, Collections, Template, $, Meteor, intToBtc, Session, btcToInt, Auth, _ */

var $betSlider;
var $betStacked;

var windowLoaded = false;
var templateRendered = false;

var initBetSlider = function(){
  if($betSlider.data('uiRangeSlider')){
    $betSlider.rangeSlider('resize');
  }else{
    $betSlider.rangeSlider({
      bounds:{min:1, max: 100},
      step: 1
    });
    // for disabled behaviour - bet button still reads from the stake input directly
    _.delay(function(){ 
      Session.set('betInput_stake', btcToInt($('input.stake').val())); 
    }, 500);
    Session.set('bet_input_slider_values', $betSlider.rangeSlider('values'));
    $betSlider.on('valuesChanged', function(e,data){
      Session.set('bet_input_slider_values', data.values); 
    });
  }
};

var initBetStacked = function(){
  if(!$betStacked.data('btoStackedBetGraph')){
    $betStacked.stackedBetGraph();
    Deps.autorun(function(){
      $betStacked.stackedBetGraph('redraw', Collections.Bets.find().fetch());
    });
  }
};

var initPlugins = function(){
  initBetSlider(); 
  initBetStacked();
};

Template.betInput.rendered = function(){
  $betSlider = $(this.find('.bet-slider'));
  $betStacked = $(this.find('.bet-graph'));
  $(this.find('.stake')).autoNumeric('init', {mDec: '8', aPad: false, aSep: ''} );
  $(this.find('.stake')).click(function() { $(this).select(); });  
  templateRendered = true;
  if(windowLoaded) initPlugins(); // otherwise init in window load callback
};

$(window).load(function(){
  windowLoaded = true;
  if(templateRendered) initPlugins(); //i'm sure there must be a better way to do this...
});

Template.betInput.helpers({
  activeBet: function(){
    return Meteor.user() && Collections.Bets.findOne({playerId: Meteor.user()._id});
  },

  betAmount: function(){
    var bet = Meteor.user() && Collections.Bets.findOne({playerId: Meteor.user()._id});
    if(bet){
      bet = intToBtc(bet.amount);
    }else{
      bet = intToBtc(Session.get('betInput_stake'));
    }
    if (isNaN(bet)) bet = 0; // can happen due to the use of reactivity on the page to read from the stake
    return bet || 0;
  },

  sufficientFunds: function(){
    var bal = Meteor.user().balance;
    var stake = Session.get('betInput_stake') || 0;
    return Meteor.user() &&  bal > 0 && bal >= stake;
  },

  identicalBet: function(){
    if(!Meteor.user()) return false;

    var range = Session.get('bet_input_slider_values');
    if (!range) return false;

    var stake  = Session.get('betInput_stake');

    var currentBet = Collections.Bets.findOne({playerId: Meteor.userId()});

    if(stake === currentBet.amount && range.min === currentBet.rangeMin && range.max === currentBet.rangeMax){
      return true;
    }

    return false;
  }
});


var throttledCall = function(action, tmpl) {
  if (action === 'revoke') {
    Meteor.call('revokeBet');
  }
  
  if (action === 'bet') {
    if($(tmpl.find('.update-btn')).is('.disabled')) return;
    
    // these two lines for safety
    var amount = btcToInt($('input.stake').val()) || 0;
    var range = $betSlider.rangeSlider('values');
    if (amount <= 0) {
      $('.stake').parents('.control-group').addClass('error'); // thanks to meteor spark, field control group resets to the correct class after an element update!
      $('.stake').focus().select();
    } 
    if ((amount > 0) && (range.min <= range.max)) {   
      Meteor.call('submitBet', amount, range.min, range.max);
    }
  }
};
var throttleClick = _.throttle(throttledCall, 1000);


Template.betInput.events({
  'click .bet-btn, click .update-btn, submit form':function(e, tmpl){
    e.preventDefault();
    throttleClick('bet', tmpl);
  },

  'click .revoke-btn': function(e){
    e.preventDefault();
    throttleClick('revoke');
  },
  
  'click .signin-btn': function(e){
    e.preventDefault();
    Auth.showSigninDialog();
  },
  
  'click .deposit-btn': function(e){
    e.preventDefault();
    Template.bank.toggleOpen();
  },
  
  'keyup .stake': function(){
    Session.set('betInput_stake', btcToInt($('input.stake').val()));
  },
  
  'click .stake-buttons .btn': function(e){
    e.preventDefault();
    
    var $btn = $(e.currentTarget);
    var oldStake = btcToInt($('input.stake').val());
    var newStake = 0;
    var user = Meteor.user();
    if($btn.is('.btn-01')) newStake = 10000000 + oldStake;
    if($btn.is('.btn-001')) newStake = 1000000 + oldStake;
    if($btn.is('.btn-0001')) newStake = 100000 + oldStake;
    if($btn.is('.btn-max') && user) newStake = user.balance;
    if($btn.is('.btn-x2')) newStake = oldStake * 2;

    Session.set('betInput_stake', newStake);

    $('input.stake').val(intToBtc(newStake));
  }
});

Template.betInput.preserve(['.stake']);
