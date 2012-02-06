(function(){
	var key = { 
					arrow:{left: 37, up: 38, right: 39, down: 40 }, 
					wasd: { left: 65, up: 87, right: 68, down: 83}, 
					space: 32, 1: 49, 2: 50, 3:51, 4:52, 5:53, 6:54, 7:55 
				},
		posMap = {c: 'chaser', b:'beater', k: 'keeper', s: 'seeker'},
		ballMap = {q: 'quaffle', s: 'snitch', b:'bludger'},
		game = {};
	
	var Player = Class.extend({
		init: function(element,idx){
			this._el = element;
			this._ball = false;
			this._position = element.data('position');
			this._team = (+element.parent().index('.team') ? -1: 1);
			this._out = false;
			this._inZone = true;
			
			element.data('idx',idx)
		},
		motion: {},
		move: function(pos){
			var p = this._el,
				b = this._ball,
				r = +p.attr('r');
								
			p.attr('cx',pos.x).attr('cy',pos.y);
			if (b){
				b = this._ball._el;
				b.attr('cy',pos.y+this._team*r*0.8);
				b.attr('cx',pos.x+this._team*r*0.8);
			}
			if (this._team == 1){
				if (+pos.x < 11){
					this._inZone = true;
				} else {
					this._inZone = false;
				}
			} else {
				if (+pos.x > 33){
					this._inZone = true;
				} else {
					this._inZone = false;
				}
			}
		},
		travel: function(direction){
			var pos = {x: +this._el.attr('cx'), y: +this._el.attr('cy') },
				newpos = {x: pos.x, y: pos.y},
				p = this._el,
				speed = 0.15,
				arrow = key.arrow,
				b = this._ball;
			direction = +direction;
			
			switch (direction){
				case arrow.up:
					newpos.y -= speed;
					break;
				case arrow.down:
					newpos.y += speed;
					break;
				case arrow.left:
					newpos.x -= speed;
					break;
				case arrow.right:
					newpos.x += speed;
					break;
			}
			this.move(newpos);
		},
		pickup: function(ball){
			if (ball._motion !== false){
				clearInterval(ball._motion.intvl)
				ball._motion = false;
			}
			ball._attached = this;
			this._ball = ball;
			var p = this._el;
			ball._el.attr('cy',parseFloat(p.attr('cy'))+this._team*parseFloat(p.attr('r'))*0.8)
			ball._el.attr('cx',parseFloat(p.attr('cx'))+this._team*parseFloat(p.attr('r'))*0.8)
		},
		toss: function(x, y){
			var ball = this._ball;
			this._ball = false;
			ball.toss(this,x,y);
		},
		hit:  function(){
			var t = this;
			this._out = true;
			t._el.attr('class',t._el.attr('class') + ' out');
			if (this._ball !== false){
				this._ball._attached = false;
				this._ball = false;
			}
			var flashOn = false,
				flashTime = setInterval(function(){
					if (flashOn){
						t._el.attr('class',t._el.attr('class').replace(/\bflash\b/gi,''));
						flashOn = false;
					} else {
						t._el.attr('class', t._el.attr('class') + ' flash');
						flashOn = true;
					}
				},100);
			setTimeout(function(){ clearInterval(flashTime); t._el.attr('class',t._el.attr('class').replace(/\bflash\b/gi,'')); },600)
			setTimeout(function(){ t._el.attr('class',t._el.attr('class').replace(/\bout\b/gi,'')); t._out=false;  },6000);
		}
	}),
	Ball = Class.extend({
		init: function(elm){
			this._attached = false;
			this._el = elm;
			this._motion=false;
		},
		attached: function(){
			return this._attached;
		},
		toss: function(from, x, y){
			var thisBall = this,
				time = 150,
				fps = 1000/60
				n = { x: (x || from._team*~~(Math.random()*6)+2), y: (y || ~~(Math.random()*4)-2)},
				current = { x: +this._el.attr('cx'), y: +this._el.attr('cy')},
				start = { x: current.x+from._team*2*parseInt(this._el.attr('r'))+n.x*0.2, y: current.y+n.y*0.1 },
				val = { x: current.x+n.x*1.2, y: current.y+n.y },
				iters = time/fps,
				i=1,
				step = { x: Math.abs(val.x-start.x)/iters, y: (val.y-start.y)/iters};
			if (from==me){
				sock.send(JSON.stringify({t:'toss', 
						   d: {id: from._el.attr('data-uid'), x: n.x, y:n.y }}));
			}
			this._attached = false;
			thisBall._el.attr('cx',start.x).attr('cy',start.y);
			this._motion = {intvl: setInterval(function(){ thisBall._el.attr('cx',start.x+from._team*i*step.x).attr('cy',start.y+(i++)*step.y);  },fps),
							from: from} ;
			setTimeout(function(){ clearInterval(thisBall._motion.intvl); thisBall._motion=false;  },time);
		}
		
	}),
	Quaffle = Ball.extend({
	
	}),
	Bludger = Ball.extend({
	
	}),
	Snitch = Class.extend({
		init: function(element){
			this._el = element;
		}
	})
	
	function collision(el1,el2){
		var x1 = +el1._el.attr('cx'),
			x2 = +el2._el.attr('cx'),
			y1 = +el1._el.attr('cy'),
			y2 = +el2._el.attr('cy'),
			r1 = +el1._el.attr('r'),
			r2 = +el2._el.attr('r');
		return !!(Math.sqrt(( x2-x1 ) * ( x2-x1 )  + ( y2-y1 ) * ( y2-y1 ) ) <= ( r1 + r2 ));
	}
	function newPlayer(d){
		console.log('new player! ' +JSON.stringify(d));
		var el = $('.team'+d.t+' .'+posMap[d.p]+':not(.controlled)').eq(0);
		el.attr('class',el.attr('class')+' controlled').attr('data-uid',d.id);
	}
	
		var t0 = new Date();
	function gameLoop(){
			//var t1 = new Date(),
			//	obs = ~~(1000/(t1-t0));
			//t0 = t1;
			
			
			/*
				PLAYER MOTION
			*/
			var cur = { x: +me._el.attr('cx'), y: +me._el.attr('cy') },
				position = '.'+me._el.data('position').toLowerCase();
			if (position == '.keeper' || position == '.chaser'){
				position = '.keeper:not(.me):not(.out), .chaser'
			}
			var collidables = $(position+':not(.me):not(.out)');	
			for (var direction in me.motion){
				if (me.motion[direction]){							
					me.travel(direction);
				}
			}
			for (var i=0, l=collidables.length; i<l; i++){
				if (collision(me,{_el: $(collidables[i])})){
					me._el.attr('cx',cur.x).attr('cy',cur.y);
					break;
				}
			}
			if (+me._el.attr('cx') != cur.x || +me._el.attr('cy') != cur.y){
				sock.send(JSON.stringify({t:'move', 
						   d: {x:+me._el.attr('cx'), y:+me._el.attr('cy'), id:me._el.attr('data-uid')}}));
				if (me._ball !== false){
					var el = me._ball._el;
					sock.send(JSON.stringify({t:'ballmove', 
							   d: {b: el.attr('class').charAt(0), i: el.index('.'+el.attr('class')), x:el.attr('cx'), y:el.attr('cy')  }}));

				}
			}
			
			
			for (var i=0, l=players.length; i<l; i++){
			
			
				/*
					BLUDGER SECTION
					and KNOCKOUT LOGIC
				*/
				for (var j=0, m=bludgers.length; j<m; j++){
					if (bludgers[j]._motion !== false 							//"active"/"in the air"
					&& bludgers[j]._motion.from._team !== players[i]._team //no friendly fire
					&& players[i]._out === false							//you're still in
					&& collision(players[i],bludgers[j])){ 					//and it hit you
						if (players[i]._position == 'beater'){ //you're a beater
							if (players[i]._ball !== false){ // you already have a ball
								//gamble deflection
								players[i].hit();
							} else {
								(Math.random() < .8) ? players[i].hit() : players[i].pickup(bludgers[j]); //gamble catch
							}
						} else if (players[i]._position == 'keeper' && players[i]._inZone===true){
							//safe
						} else { //you're definitely hit
							players[i].hit();
						}
						break; //exits bludger loop
					} else if ( bludgers[j].attached() === false  //nobody has it
								&& players[i]._position=='beater' //position can use it
								&& bludgers[j]._motion === false  //sitting on the ground
								&& players[i]._ball ===false      //don't have a ball already
								&& players[i]._out === false	  //you're not out
								&& collision(players[i],bludgers[j])){ //and you're touching it 
						players[i].pickup(bludgers[j]);
					}
				}
				
				/*
					QUAFFLE TIME
				*/
				if (players[i]._ball===false  //not holding a ball
				&& (players[i]._position == 'chaser' //chaser or
				  || players[i]._position=='keeper') //keeper
				&& quaf.attached()===false			// open quaffle
				&& players[i]._out === false 		//not out
				&& collision(players[i],quaf)){		//touching the ball 
					if (quaf._motion !== false){	//gamble catch
						var chance = (players[i]._position=='keeper' ? 0.3 : 0.2); //keeper has better hands
						if (quaf._motion.from._team == players[i]._team){ //passes more accurate
							chance += 0.1;
						}
						(Math.random() < chance ) ? players[i].pickup(quaf) : null;
					} else {
						players[i].pickup(quaf);
					}
				}
				
				
				
				/*
					SNITCHY
				*/
				if (players[i]._position=='seeker'
				&& players[i]._out ===false
				&& collision(players[i],snitch)){
					alert('YOU WIN');
					game =false;
				}
				
				
			}
		if (game){
			window.requestAnimFrame(gameLoop);
		}
	}
	
	
	function init(d){
		var el = $('.team'+d.t+' .'+posMap[d.p]+':not(.controlled)').eq(0);
			
		me = players[el.data('idx')];
		el.attr('class',el.attr('class')+' me').attr('data-uid',d.id);
		
		$(document).keydown(function(e){
			var arrow = key.arrow;
		    switch (e.keyCode){
		    	case arrow.left:
		    	case arrow.right:
		    	case arrow.up:
		    	case arrow.down:
		    		if (!me.motion[e.keyCode]){
		    			me.motion[e.keyCode] = true;
		    		}
		    		return false;
		    	case key.space:
		    		return false;
		    	default:
		    		return true;
		    }
		});
		$(document).keyup(function(e){
			var arrow = key.arrow;
			 switch (e.keyCode){
		    	case arrow.left:
		    	case arrow.right:
		    	case arrow.up:
		    	case arrow.down:
		    		me.motion[e.keyCode] = false;
		    		return false;
		    	case key.space:
		    		if (me._ball !== false && me._ball.attached() !== false){
		    			me.toss();
		    		}
		    		return false;
		    	default:
		    		return true;
		    }
		});
		gameLoop()
	}
	var quaf = new Quaffle($('.quaffle')),
		snitch = new Snitch($('.snitch')),
		bludgers = [],
		players = [],
		me,
		dispatch = {}
		game=true;
	$('.bludger').each(function(){
		bludgers.push(new Bludger($(this)));
	});
	$('.player').each(function(idx){
		players.push(new Player($(this),idx));
	})
		
	
	var sock = io.connect('/',{port: 3050});
	sock.on('message',function(d){
		d = JSON.parse(d);
		console.log('msg: '+JSON.stringify(d));
		if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
			dispatch[d.t].call(sock,d.d);
		}
	});
	dispatch.welcome = function(d){
		if (d==='full'){
			alert('all positions have been full, please wait for an open match')
		} else {
			init(d);
		}
	};
	dispatch.np = function(d){ //new player
		var el;
		if (d instanceof Array){
			for (var i=0, l=d.length; i<l; i++){
				newPlayer(d[i]);
			}
		} else {
			newPlayer(d);
		}
	};
	dispatch.mv = function(d){	//movement
		players[$('.player[data-uid='+d.id+']').data('idx')].move(d);
	};
	dispatch.throw = function(d){	//
		var p = players[$('.player[data-uid='+d.id+']').data('idx')]
		if (p !== false){
			p.toss(d.x,d.y);
		}
	};
	dispatch.bmv = function(d){
		$('.'+ballMap[d.b]+':eq('+d.i+')').attr('cx',d.x).attr('cy',d.y);
	};
	
})();