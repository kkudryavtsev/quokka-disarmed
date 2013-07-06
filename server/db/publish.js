AddressPool = new Meteor.Collection("addressPool"); // server only

Meteor.publish("flags", function(){
  return Collections.Flags.find({});
});

Meteor.publish("news", function(){
  return Collections.News.find({}, {sort: {timestamp: -1}, limit: 10});
});

Meteor.publish("games", function(){
  return Collections.Games.find({},{sort: {createdAt: -1}, limit: 100});
});

Meteor.publish("bets", function(){ //update to publish only for the current game
  return Collections.Bets.find({gameId: DB.currentGame()._id});
});

Meteor.publish("userData", function(){  // built-in meteor collection
  return Meteor.users.find({_id: this.userId},
                           {fields: {
                             'balance': 1,
                             'depositAddress': 1
                           }});
});

Meteor.publish("users", function(){
  return Meteor.users.find({}, {
    fields: {
      username: 1
    }
  });
});

Meteor.publish("payouts", function(){
  return Collections.Payouts.find({},{sort: {timestamp: -1}, limit: 10});
});

Meteor.publish("allTimeStats", function(){
  return Collections.AllTimeStats.find({});
});

// the user shouldn't have the right to modify anything within their user profiles
Meteor.users.deny({update: function () { return true; }});
