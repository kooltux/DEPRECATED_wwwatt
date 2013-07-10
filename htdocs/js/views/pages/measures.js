var DEBUG=false;

define([
	'app',
	'config',
	'underscore',
	'socketio',
	'd3'
],function(App,Config,_,io,d3) {
	return can.Control.extend({
		init: function(el,options) {
			// init samples array
			this.srvdata=[];

			// init params (history, frequency)
			this.history=3600; // seconds
			this.setHistory(this.history);
			this.frequency=1; // HZ
			this.setFrequency(this.frequency);

			// init websocket
			this.pause();
			this.ioconnect();

			// init chart
			this.initChart();
		},
		destroy: function() {
			this.iodisconnect();
		},

		addSamples: function(/*anything*/) {
			function _push() {
				_.toArray(arguments).forEach(function(o) {
					if (o instanceof Array) {
						_push.apply(this,o);
					}
					else if (typeof o == 'function') {
						_push(o());
					}
					else if (o === null) {
						// restart after interrupt
						this.srvdata.push(o);
					}
					else if (typeof o == 'object') {
						this.srvdata.push(o);
					}
				},this);
			}

			_push.apply(this,arguments);
			can.trigger(this.srvdata,'newsamples');
		},

		// events
		'.btnplay click': function() {
			this.playpauseToggle();
		},

		'.sethist click': function(ctrl, ev) {
			ev.preventDefault();

			// retrieve value in link
			var value=ctrl.attr("value");

			ctrl.parent().parent().children().removeClass("active");
			ctrl.parent().addClass("active");

			this.setHistory(value);
		},

		'.setfreq click': function(ctrl, ev) {
			ev.preventDefault();

			// retrieve value in link
			var value=ctrl.attr("value");

			ctrl.parent().parent().children().removeClass("active");
			ctrl.parent().addClass("active");

			this.setFrequency(value);
		},

		// -------------------------- charting ----------------------------
		initChart: function() {
			var xdata="ts";
			var ydata1="power";
			var ydata2="voltage";
			var ydata3="current";
			var labels={
				ts: {
					name: "Time",
					unit: null,
					color: "black",
					lightcolor: "#888"
				},
				power: {
					name: "Power",
					unit: "W",
					color: "steelblue",
					lightcolor: "lightsteelblue"
				},
				current: {
					name: "Current",
					unit: "A",
					color: "#d6293a",
					lightcolor: "#FF98A0"
				},
				voltage: {
					name: "Voltage",
					unit: "V", 
					color: "#00C41D",
					lightcolor: "#80FF92"
				}
			};

			// samples array
			var svgdata=[];

			// loading page
			var chartdiv=this.element.find('#chart');
			var viewport={w: 1000, h: 500};

			var margin = {top: 10, right: 130, bottom: 100, left: 50},
				margin2 = {top: 440, right: 10, bottom: 20, left: 50},
				width = viewport.w - margin.left - margin.right,
				height = viewport.h - margin.top - margin.bottom,
				height2 = viewport.h - margin2.top - margin2.bottom;

			var x = d3.time.scale().range([0, width]),
				y1 = d3.scale.linear().range([height, 0]),
				y2 = d3.scale.linear().range([height, 0]),
				y3 = d3.scale.linear().range([height, 0]),
				xs = d3.time.scale().range([0, width]),
				ys = d3.scale.linear().range([height2, 0]);

			var xAxis = d3.svg.axis().scale(x).orient("bottom"),
				xsAxis = d3.svg.axis().scale(xs).orient("bottom"),
				yAxis1 = d3.svg.axis().scale(y1).orient("left");
				yAxis2 = d3.svg.axis().scale(y2).orient("right");
				yAxis3 = d3.svg.axis().scale(y3).orient("right");

			var area = d3.svg.area()
				.interpolate("step-before")
				.x(function(d) { return x(d[xdata]); })
				.y0(height)
				.y1(function(d) { return y1(d[ydata1]); });

			var sarea = d3.svg.area()
				.interpolate("step-before")
				.x(function(d) { return xs(d[xdata]); })
				.y0(height2)
				.y1(function(d) { return ys(d[ydata1]); });

			var line1 = d3.svg.line()
				.interpolate("step-before")
				.x(function(d) { return x(d[xdata]); })
				.y(function(d) { return y1(d[ydata1]); });

			var line2 = d3.svg.line()
				.interpolate("monotone")
				.x(function(d) { return x(d[xdata]); })
				.y(function(d) { return y2(d[ydata2]); });

			var line3 = d3.svg.line()
				.interpolate("monotone")
				.x(function(d) { return x(d[xdata]); })
				.y(function(d) { return y3(d[ydata3]); });

			var svg = d3.select(chartdiv[0]).append("svg")
				.attr("viewBox",[0,0,viewport.w,viewport.h].join(" "))
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("preserveAspectRatio", "xMinYMin meet")
			;

			$(window).on("resize",function() {
				var w=chartdiv.width();
				var h=Math.round(w*height/width);
				svg.attr("width",w).attr("height",h);
			}).trigger("resize");

			svg.append("defs").append("clipPath")
				.attr("id", "clip")
				.append("rect")
				.attr("width", width)
				.attr("height", height);

			function axis_legend(axis,dname) { 
				var txt="unknown";
				var color="black";
				if (dname in labels) {
					var def=labels[dname];
					if (def.name) txt=def.name;
					if (def.unit) txt+=" ("+def.unit+")";
					if (def.color) color=def.color;
				}

				return function() {
					var pos={ x:0, y:0, dx: 0, dy:0, rot: 0, anchor: "middle" };
					switch(axis.orient()) {
						case "top": 
							pos.x=width/2;
							pos.dy="-2.2em";
							break;
						case "bottom":
							pos.x=width/2;
							pos.dy="2.2em";
							break;
						case "left":
							pos.y=0;
							pos.rot=-90;
							pos.dy="-2em";
							pos.anchor="end";
							break;
						case "right":
							pos.y=0;
							pos.rot=-90;
							pos.dy="3em";
							pos.anchor="end";
							break;
						default:
							break;
					}

					this.append("text")
						.attr("transform","rotate("+pos.rot+")")
						.attr("x",pos.x)
						.attr("y",pos.y)
						.attr("dx",pos.dx)
						.attr("dy",pos.dy)
						.attr("text-anchor",pos.anchor)
						.attr("class","description")
						.attr("style","font-size: 1.4em")
						.style("fill",color)
						.text(txt)
					;
				};
			}

			var focus = svg.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			// data 1
			focus.append("path")
				.data([svgdata])
				.attr("class","data-area")
				.style("fill",labels[ydata1].lightcolor)
				.attr("clip-path", "url(#clip)")
				.attr("d", area);

			focus.append("path")
				.data([svgdata])
				.attr("class","data-line1")
				.style("stroke",labels[ydata1].color)
				.attr("clip-path", "url(#clip)")
				.attr("d",line1);

			// x axis
			/* custom format
				var tfmt=d3.time.format("%X"); //.%L");
				function tformater(dt) { return tfmt(dt); }
			*/
			focus.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.style("stroke",labels[xdata].color)
				.style("fill",labels[xdata].color)
				.call(xAxis.tickSubdivide(false)) //.tickFormat(tformater))
				.call(axis_legend(xAxis,xdata))
			;

			focus.append("g")
				.attr("class", "y axis y1")
				.style("stroke",labels[ydata1].color)
				.call(yAxis1.tickSubdivide(true).tickSize(-width,5,0))
				.call(axis_legend(yAxis1,ydata1))
			;

			// data 2
			focus.append("path")
				.data([svgdata])
				.attr("class","data-line2")
				.style("stroke",labels[ydata2].color)
				.attr("clip-path", "url(#clip)")
				.attr("d",line2);

			focus.append("g")
				.attr("class", "y axis y2")
				.style("stroke",labels[ydata2].color)
				.attr("transform", "translate("+(width+10)+",0)")
				.call(yAxis2.tickSubdivide(true))
				.call(axis_legend(yAxis2,ydata2))
			;

			// data 3
			focus.append("path")
				.data([svgdata])
				.attr("class","data-line3")
				.style("stroke",labels[ydata3].color)
				.attr("clip-path", "url(#clip)")
				.attr("d",line3);

			focus.append("g")
				.attr("class", "y axis y3")
				.style("stroke",labels[ydata3].color)
				.attr("transform", "translate("+(width+margin.right-50)+",0)")
				.call(yAxis3.tickSubdivide(true))
				.call(axis_legend(yAxis3,ydata3))
			;

			var brush = d3.svg.brush()
				.x(xs)
				.on("brush", function() {
					x.domain(brush.empty() ? xs.domain() : brush.extent());
					focus.select(".data-area").attr("d", area);
					focus.select(".data-line1").attr("d", line1);
					focus.select(".data-line2").attr("d", line2);
					focus.select(".data-line3").attr("d", line3);
					focus.select(".x.axis").call(xAxis);
				})
			;

			var context = svg.append("g")
				.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

			context.append("path")
				.data([svgdata])
				.attr("class","small-area")
				.style("fill",labels[ydata1].lightcolor)
				.attr("d", sarea);

			context.append("g")
				.attr("class", "x axis")
				.style("stroke",labels[xdata].color)
				.style("fill",labels[xdata].color)
				.attr("transform", "translate(0," + height2 + ")")
				.call(xsAxis.tickSubdivide(0).tickSize(-height2));

			context.append("g")
				.attr("class", "x brush")
				.call(brush)
				.selectAll("rect")
				.attr("y", -6)
				.attr("height", height2 + 7);

			// legend
			var lcontainer=svg.append("g")
				.attr("class","legend")
				.attr("transform",function(d) { return "translate("+(width+margin.left+20)+","+(margin2.top)+")"; });
			(function() {
				var lrect=lcontainer.append("rect");

				function lformatter(dname,i) {
					if (!(dname in labels)) return "unknown";
					var def=labels[dname];
					var txt=d3.select(this);
					txt.append("tspan").text((def.name || "unknown")+" : ");
					txt.append("tspan")
						.attr("class","data-legend"+(i+1))
						.text("----.----")
					;
					if (def.unit)
						txt.append("tspan").text(" "+def.unit);
				}

				var legend=lcontainer.selectAll(".legend")
					.data([ydata1,ydata2,ydata3])
					.enter()
						.append("g")
						.attr("class","legend")
						.attr("transform",function(d,i) { return "translate(0,"+(i*20)+")"; })
						.append("text")
							.style("fill",function(d) { return labels[d].color; })
							.style("text-anchor","begin")
							.each(lformatter)
					;

				var bbox=lcontainer[0][0].getBBox();
				lrect
					.attr("x",bbox.x-5)
					.attr("y",bbox.y-5)
					.attr("width",bbox.width+20)
					.attr("height",bbox.height+10)
					.style("stroke","steelblue")
					.style("fill","#eee")
				;
			})();

			var self=this;
			svgdata.interrupted=false;
			var numformatter=d3.format(".5g");
			can.bind.call(this.srvdata,'newsamples',function(ev) {
				// insert new elements
				self.srvdata.forEach(function(d) {
					if (d === null) {
						svgdata.interrupted=true;
						return;
					}
					if (svgdata.interrupted) {
						svgdata.interrupted=false;

						if (svgdata.length) {
							// add the last sample with 0
							var d2=_.clone(_.last(svgdata));
							d2[ydata1]=0;
							d2[ydata2]=0;
							d2[ydata3]=0;
							svgdata.push(d2);

							// add the current sample with 0
							d2=_.clone(d);
							d2[ydata1]=0;
							d2[ydata2]=0;
							d2[ydata3]=0;
							svgdata.push(d2);
						}
					}

					// push the sample
					svgdata.push(d);
				});
				self.srvdata.splice(0); // empty list

				// remove elements older than history
				if (svgdata.length) {
					var mints=_.last(svgdata)[xdata]-self.history*1000;
					while (svgdata.length && (svgdata[0][xdata]<mints))
						svgdata.shift();
				}

				if (!svgdata.length)
					return;

				xs.domain(d3.extent(svgdata.map(function(d) { return d[xdata]; })));
				x.domain(brush.empty() ? xs.domain() : brush.extent());
				y1.domain([0, d3.max(svgdata.map(function(d) { return d[ydata1]; }))]);
				y2.domain([0, d3.max(svgdata.map(function(d) { return d[ydata2]; }))]);
				y3.domain([0, d3.max(svgdata.map(function(d) { return d[ydata3]; }))]);
				ys.domain(y1.domain());

				focus.select(".data-area").attr("d", area);
				focus.select(".data-line1").attr("d", line1);
				focus.select(".data-line2").attr("d", line2);
				focus.select(".data-line3").attr("d", line3);
				focus.select(".x.axis").call(xAxis);
				focus.select(".y.axis.y1").call(yAxis1);
				focus.select(".y.axis.y2").call(yAxis2);
				focus.select(".y.axis.y3").call(yAxis3);

				context.select("path").attr("d", sarea);
				context.select(".x.axis").call(xsAxis);

				// update legend
				if (svgdata.length) {
					var last=_.last(svgdata);
					lcontainer.select(".data-legend1").text(numformatter(last[ydata1]));
					lcontainer.select(".data-legend2").text(numformatter(last[ydata2]));
					lcontainer.select(".data-legend3").text(numformatter(last[ydata3]));
				}
				else {
					lcontainer.select(".data-legend1").text("----.----");
					lcontainer.select(".data-legend2").text("----.----");
					lcontainer.select(".data-legend3").text("----.----");
				}

			});
		},

		/* --------------------- controls --------------------------- */

		play: function() {
			DEBUG && console.log("play");
			this.addSamples(null);
			this.subscribe();
		},
		pause: function() {
			DEBUG && console.log("pause");
			this.unsubscribe();
		},
		playpauseToggle: function() {
			if (this.iosubscribed)
				this.pause();
			else
				this.play();
		},
		_update_playpause: function(pending) {
			// remove classes
			var btn=this.element.find('.btnplay');
			btn.removeClass("btn-success btn-warning");

			if (pending) {
				btn.html('<i class="icon-refresh"></i> Wait').addClass("btn");
			}
			else if (this.iosubscribed) {
				btn.html('<i class="icon-pause"></i> Pause').addClass("btn-warning");
			}
			else {
				btn.html('<i class="icon-play"></i> Play').addClass("btn-success");
			}
		},

		setFrequency: function(freq) {
			DEBUG && console.log("New frequency: "+freq);
			this.frequency=freq;
			this.element.find('#setfreq-label').text("Frequency: "+freq+"Hz");

			// resubscribe
			if (this.iosubscribed)
				this.subscribe();
		},

		setHistory: function(seconds) {
			this.history=seconds;
			DEBUG && console.log("New history: "+this.history);
			this.element.find('#sethist-label')
				.text("History: "+ 
					(function(v) {
						if (v>3600)		{ return Math.round(v/3600)+" h"; }
						else if (v>60)	{ return Math.round(v/60)+" mn"; }
						else return v+" s"; 
					})(this.history)
			);
		},

		setState: function(state) {
			var btn=this.element.find('#sockio_state');

			// first remove all classes
			btn.removeClass("label-success label-warning label-important label-info label-inverse");

			var label,klass;
			switch(state) {
				case 'connected':
					label="Connected";
					klass="label-success";
					break;
				case 'disconnected':
				default:
					label="Disconnected";
					klass="label-important";
					break;
			}

			btn.html(label).addClass(klass);
		},

		/* --------------------- socket.io -------------------------- */

		ioconnect: function() {
			if (this.iosocket) return; // already connected
			var self=this;


			var s=this.iosocket=io.connect('/');

			DEBUG && console.log("SOCKIO - Connecting...");

			// base handlers
			s.on('connect',function() {
				DEBUG && console.log("SOCKIO - Connected");
				s.send("Client connected");
				self.setState("connected");
				if (self.iosubscribed) {
					// re-subscribe
					self.iosubscribed=false;
					self.subscribe();
				}
			});

			s.on('error',function(err) {
				DEBUG && console.log("SOCKIO - Error",err);
			});

			s.on('disconnect',function() {
				DEBUG && console.log("SOCKIO - Disconnected");
				self.setState("disconnected");
				if (self.ioclosed) {
					delete self.iosocket;
					io.sockets={}; // hack to remove socket from cache
				}
			});

			s.on('reconnect',function() {
				DEBUG && console.log("SOCKIO - Reconnected");
				self.setState("connected");
			});

			s.on('message',function(data) {
				DEBUG && console.log("SOCKIO - Message",data);
			});

			// subscribe/unsubscribe
			s.on('failure',function(data) {
				DEBUG && console.log("SOCKIO - failure",data);
			});
			s.on('subscribed',function(service,frequency) {
				DEBUG && console.log("SOCKIO - Subscribed to "+service+" at "+frequency+" Hz");
				self.iosubscribed=true;
				self._update_playpause(false);
			});
			s.on('unsubscribed',function(service) {
				DEBUG && console.log("SOCKIO - unsubscribed to "+service);
				self.iosubscribed=false;
				self._update_playpause(false);
			});

			s.on('samples',function(samples) {
				DEBUG && console.log("SOCKIO - samples"); //,samples);

				self._blink(true);

				// decode json
				try {
					samples=JSON.parse(samples);
				}
				catch(e) {
					DEBUG && console.log("Samples format error: "+e);
					return;
				}

				self.addSamples(samples);
			});
		},

		_blink: function(state) {
			// blink the receive indicator
			if (!this._indicator) {
				this._indicator={
					el: this.element.find("#sockio_data"),
					state: !state,
					timer:null
				};
			}
			var ctx=this._indicator;

			// remove previous timer if any
			clearTimeout(ctx.timer);

			if (state) {
				if (!ctx.state) {
					ctx.el.addClass("badge-warning");
				}
				ctx.timer=setTimeout(_.bind(this._blink,this,false),150);
			}
			else {
				if (ctx.state) {
					ctx.el.removeClass("badge-warning");
				}
			}
			ctx.state=state;
		},
		
		iodisconnect: function() {
			DEBUG && console.log("SOCKIO - Closing");
			if (this.iosocket)
				this.iosocket.disconnect();
			this.ioclosed=true; // avoid reconnect
		},
			
		subscribe: function() {
			if (!this.iosocket) throw new Error("Not connected");
			DEBUG && console.log("SOCKIO - Subscribing...");
			this._update_playpause(true);
			if (this.iosocket)
				this.iosocket.emit('subscribe', this.frequency /*Hz*/);
		},

		unsubscribe: function() {
			DEBUG && console.log("SOCKIO - Unsubscribing...");
			this.iosubscribed=false;
			this._update_playpause(false);
			if (this.iosocket)
				this.iosocket.emit('unsubscribe');
		}
	});
});

