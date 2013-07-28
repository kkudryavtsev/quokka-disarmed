$.widget("bto.wheelBetGraph",$.bto.betGraph,{

  options:{
    svgHeight: 250,
    svgWidth: 250,
  },

  _create: function(){
    this._super();

    // properties (instance) definitions, jquery widget requires for them to be located here
    this._bankRadius = this.options.svgHeight/2;
    this._innerRadius = this._bankRadius-15;
    this._previousBankBalance = 0; // starts from nill bank
    this._previousBetCollection = []; // temporary fix for duplicate autorun trigger bug
    this._gameHasStarted = false;
    this._transitionDuration = 800; 
    
    this._createSvg();

    this._draw();
  },


  _createSvg: function(){
    var svgHeight = this.options.svgHeight;
    var svgWidth = this.options.svgWidth;

    this._svg = d3.select(this.element[0]).append("svg")
      .attr("viewBox", "0 0 250 250") // <min-x> <min-y> <width> <height>
      .attr("preserveAspectRatio", "xMidYMid")
      .attr("height", svgHeight)
      .append("g")
        .attr("transform", "translate(" + svgHeight / 2 + "," + svgHeight / 2 + ")");
  },


  _draw: function(){
    this._setColorRange();

    this._pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.amount; }); // key

    this._arc = d3.svg.arc()
      .innerRadius(this._innerRadius)
      .outerRadius(this._bankRadius);

    this._backgroundPath = this._svg.append("path")
        .datum({startAngle:0, endAngle: 2 * Math.PI})
        .attr("id", "waitingBackground")
        .style("fill", "#C4C4C4")
        .attr("d", this._arc);
        //transition().delay(500).attr("transform", "scale(100)"); // not doing that because looks ugly

    this._centerGroup = this._svg.append("g")
      .attr("class", "center-group");

    this._totalLabel = this._centerGroup.append("text")
      .attr("class", "wheel-bank-label")
      .attr("dy", -32)
      .attr("text-anchor", "middle")
      .text("BANK");

    this._totalValue = this._centerGroup.append("text")
      .attr("class", "wheel-bank-total")
      .attr("dy", 0)
      .attr("text-anchor", "middle")
      .text("฿ 0.00000000");

    this._timer = this._centerGroup.append("text")
      .attr("class", "wheel-bank-timer")
      .attr("dy", 50)
      .attr("text-anchor", "middle")
      .text("Place your bets please");

  },
  

  redraw: function(betCollection){
    if(betCollection) {
      var duplicateCallDetected = this._previousBetCollection.compare(betCollection);
      if (!duplicateCallDetected) {

        this._d3data = this._convertBetsToWheelData(betCollection);

        this._updateTotalValue();
        this._wheelDefineD3Sequence();
      } else { 
        console.log('duplicate autorun output ignored in stacked bet graph');
      }
    }
    this._previousBetCollection = betCollection;
  },


  redrawTimer: function(countDown){
    this._timer
      .text('Roll in ' + countDown + ' seconds');
  },


  killTimer: function() {
    this._timer
      .text('Place your bets please');
  },


  _convertBetsToWheelData:function(betCollection){
    return _.map(betCollection, function(bet){
      return {
          playerName: bet.playerName,
          amount: bet.amount
        };
    });
  },


  _updateTotalValue: function(){
    var cumulative = _.reduce(this._d3data,function(memo,num){ 
      return memo + num.amount;
    }, 0, this);
    
    this._totalValue
      .text(this._previousBankBalance)
      .transition()
        .duration(this._transitionDuration)
        .ease('linear') // needed for custom tween on text
        .tween("text", function() {
          var i = d3.interpolate(this.textContent, cumulative);
          return function(t) {
            this.textContent = '฿ ' + intToBtc(i(t)).toFixed(8);
          };
        });

    this._previousBankBalance = cumulative;
  },


  _wheelDefineD3Sequence: function(){
    enterAntiClockwise = {
      startAngle: Math.PI * 2,
      endAngle: Math.PI * 2
    };

    this._path = this._svg.selectAll("path:not(#waitingBackground)");

    this._pathData = this._path
      .data(this._pie(this._d3data), function (d) { return d.data.playerName; });

    this._pathData.enter().append("path")
      .attr("fill", function (d, i) { return this._colorRange(i); }.bind(this))
      .attr("d", this._arc(enterAntiClockwise))
      .each(function (d) {
        this._current = {
          data: d.data,
          value: d.value,
          startAngle: enterAntiClockwise.startAngle,
          endAngle: enterAntiClockwise.endAngle
        };
      }).call(
        d3.helper.tooltip()
          .style({
            'text-align':'center',
            'font-size': '12px',
            'line-height': '20px',
            'padding': '4px 12px 4px 16px',
            'background': 'rgba(0, 0, 0, 0.8)',
            'color': '#fff',
            'border-radius': '2px',
            'font-family': 'Helvetica Neue, Helvetica, Arial, sans-serif'
          }).text(function(d, i) { return d.data.playerName + '<br> BTC ' + intToBtc(d.value).toFixed(8); })
      );

    this._pathData.exit()
    .transition()
      .duration(this._transitionDuration * 1.5)
      .attrTween('d', this._getArcTweenOutFunction())
    .remove();

    this._pathData
    .transition()
      .duration(this._transitionDuration * 1.5)
      .attrTween("d", this._getArcTweenFunction());

  },



  _getArcTweenFunction: function() {
    var arc = this._arc;
    
    return function(a){
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      
      return function(t) {
        return arc(i(t));
      };
    };
  },


  _getArcTweenOutFunction: function() {
    var arc = this._arc;
    
    return function(a){
      var i = d3.interpolate(this._current, {
        startAngle: Math.PI * 2,
        endAngle: Math.PI * 2, value: 0
      });

      this._current = i(0);
      
      return function (t) {
        return arc(i(t));
      };
    };
  }
});
