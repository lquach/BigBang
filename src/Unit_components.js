// Utilities component
// Keep all the basic initializations, funtions and event binding
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("Utilities",
{
	init: function()
	{
		this.requires("2D, DOM, Collision");

		var self  = this;
		
		// If HP reaches 0, the entity is destroyed
		this.bind("HPChanged", function(amount)
		{			
			if (self.currentHP-amount<=0)
			{
				self.kill();
			}
		});
	},

	// Construct the basic attributes
	Utilities: function()
	{
		this.currentHP = this.maxHP;
		this.state = "StandBy";

		// Entity for the feet position
		this.feet = Crafty.e("2D")
				.attr({x: this.x + this.w/2, y: this.y + this.h});
		this.attach(this.feet);

		// Entity for the center position
		this.center = Crafty.e("2D")
				.attr({x: this.x + this.w/2, y: this.y + this.h/2});
		this.attach(this.center);

		// Set z position
		// this.z = this.feet.y;

		// Set map for collision
		this.collision();

		return this;
	},

	// Kill the entity and all the relating entities
	kill: function()
	{
		this.currentHP = 0;
		this.state = "Dead";

		// If the unit is associated with a slot, the slot becomes available again
		if (this.slot!==undefined)
			this.slot.makeAvailable();
		
		this.destroy(); // Healthbar and attackArea are children, will be destroyed automatically
		
		/*
		if (this.has("HealthBar"))
			this.healthBar.destroy();

		if (this.has("attackArea"))
			this.attackArea.destroy();
		*/
	}
});

// AutoMove component
// Make the CPU move by itself with animation
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("AutoMove",
{
	init: function()
	{
		this.requires("Utilities");
	},

	// The entity automoves to the other side
	autoMove: function()
	{
		this.dX = this.player.side * this.movingSpeed;
		this.dY = 0;

		this.bind("EnterFrame", this.move);
	},

	// Set the target to move to and computer dX and dY - move step - based on the speed
	setMoveToTarget: function(target, position)
	{
		this.target = target;

		if (target[position].x - this[position].x==0)
		{
			this.dX = 0;
			this.dY = target[position].y - this[position].y;
		}
		else
		{
			var signX = (target[position].x - this[position].x) / Math.abs(target[position].x - this[position].x);
			var signY = (target[position].y - this[position].y) / Math.abs(target[position].y - this[position].y);
			
			var ratio = Math.abs((target[position].y - this[position].y) / (target[position].x - this[position].x));
			
			this.dX = signX * (this.movingSpeed / Math.sqrt(1 + ratio*ratio));
			this.dY = signY * ratio * Math.abs(this.dX);
		}
	},
	
	// Move the character with animation according to dX and dY
	move: function()
	{
		this.state = "Moving";		
		
		if (this.x > WIDTH || this.x < -this.w)
		{
			// Kill the entity when it is outside of the map
			this.kill();
		}
		
		this.x += this.dX;
		this.y += this.dY;
		
		if (this.dX<0)
		{
			if (!this.isPlaying("walkLeft"))
				this.stop().animate("walkLeft", 20, -1);
		}
		else if (this.dX>0)
		{
			if (!this.isPlaying("walkRight"))
				this.stop().animate("walkRight", 20, -1);
		}
	}
});

// AttackArea component
// Create an attack area for the entity
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("AttackArea",
	{
		createAttackArea: function()
		{
			var self = this;

			// Create a hit area
			this.attackArea = Crafty.e("2D, Collision");

			// For visualization
			/*
			this.attackArea.addComponent("DOM, Color");
			if (this.player.side==1)
				this.attackArea.color("blue");
			else
				this.attackArea.color("orange");
			*/
			

			this.attackArea.center = {x: this.center.x, y: this.center.y};
			this.attackArea.attr({x: this.attackArea.center.x - this.attackRange, y: this.attackArea.center.y - this.attackRange,
						w: 2 * this.attackRange, h: 2 * this.attackRange, z: -1});

			this.attach(this.attackArea);
			
			// The circle relatives to the attack area
			this.attackArea.collision(new Crafty.circle(this.attackRange, this.attackRange, this.attackRange));

			// The circle will have the center as the top - left corner of the attack area
			// So we need to shift if so its center is the center of the attack area
			this.attackArea.map.shift(this.attackRange, this.attackRange);

			// Check if something "alive" is inside the attack area
			this.attackArea.onHit("HealthBar", function(hitObj)
				{
					for (var i = 0; i < hitObj.length; i++)
						if (hitObj[i].obj.player!==self.player)
						{
							self.trigger("EnemyIsInRange", hitObj[i].obj);

							return;
						}
				});
		}
	});

// Fight component
// Include all the basic functions to allow the entity to attack another entity
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("Fight",
{
	init: function()
	{
		this.requires("AttackArea, AutoAttack");

		var self =  this;

		// Increase the attack counter over time
		//***********************************************************************************
		this.attackCounter = 1000;
		
		this.bind("EnterFrame", function()
		{
			if (self.state!=="Attacking" && self.attackCounter<1000)
				self.attackCounter++;
		});
	},

	// Check if the target is in the attack range
	isInRange: function(theTarget)
	{		
		var deltaX = Math.abs(theTarget.feet.x - this.feet.x);
		var deltaY = Math.abs(theTarget.feet.y - this.feet.y);
		
		var distance = Math.sqrt ( deltaX*deltaX + deltaY*deltaY );

		if (distance <= this.attackRange)
			return true;
		return false;
	}
});

// ShortRangeAttack component
// Attack the other characters in closed range
// Need to have a target before binding to the attack function
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("ShortRangeAttack",
{	
	init: function()
	{
		this.requires("Fight");
	},
	
	shortRangeAttack: function()
	{		
		this.state = "Attacking";
		
		if (this.target===undefined || this.target.currentHP<=0)
		{
			this.stop();	
			this.unbind("EnterFrame", this.shortRangeAttack);
			
			this.state = "Moving";
			this.bind("EnterFrame", this.move);
			
			return;
		}
		
		// The target triggers "Be Attacked" event
		//this.target.trigger("BeAttacked", this);
		
		// Only attack when the counter reaches the interval
		// Then set counter back to 0
		if (this.attackCounter>=this.attackInterval)
		{
			if (this.target.feet.x < this.feet.x)
			{
				if (!this.isPlaying("attackLeft"))
					this.stop().animate("attackLeft", 15, 1);
			}
			else //if (this.feet.x < this.target.feet.x)
			{
				if (!this.isPlaying("attackRight"))
					this.stop().animate("attackRight", 15, 1);
			}
					
			this.target.trigger("HPChanged", this.attack);
			
			this.attackCounter = 0;
		}
		this.attackCounter++;
	}
});

// Shot component
// Create a shot
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("Shoot",
	{
		shoot: function()
		{
			var self = this;
			
			var shot = Crafty.e("2D, DOM, Color, Collision, AutoMove")
					.attr({x: self.center.x, y: self.center.y, z: 1000, w: 6, h: 6,
					maxHP: 0,
					movingSpeed: 13});

			shot.Utilities();
			shot.color("#FF0066");
				
			shot.setMoveToTarget(self.target, "center");
			
			shot.bind("EnterFrame", function()
			{
				shot.x += shot.dX;
				shot.y += shot.dY;

				if (shot.x < -shot.w || shot.x > WIDTH || shot.y < -shot.h || shot.y > HEIGHT)
				{
					shot.destroy();
				}	
			});
			
			shot.onHit("HealthBar", function(hitObj)
			{
				for (var i = 0; i < hitObj.length; i++)
					if (hitObj[i].obj.player!==self.player)
					{
						hitObj[i].obj.trigger("HPChanged", self.attack);

						// The shot is destroyed
						shot.destroy();

						return;
					}	
			});	
		}
	});

// LongRangeAttack component
// Need to have a target before binding to the attack function
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("LongRangeAttack",
{
		init: function()
		{
			this.requires("Fight, Shoot");
		},
		
		longRangeAttack: function()
		{
			this.state = "Attacking";
			
			if (this.target===undefined || this.target.currentHP<=0)
			{
				this.stop();	
				this.unbind("EnterFrame", this.longRangeAttack);
				
				this.state = "StandBy";
				
				return;
			}
			
			// The target triggers "Be Attacked" event
			//this.target.trigger("BeAttacked", this);
			
			// Only attack when the counter reaches the interval
			// Then set counter back to 0
			if (this.attackCounter>=this.attackInterval)
			{
				/* Does not need animation for now
				if (this.target.x < this.x)
				{
					if (!this.isPlaying("attackLeft"))
						this.stop().animate("attackLeft", 13, 1);
				}
				else if (this.x < this.target.x)
				{
					if (!this.isPlaying("attackRight"))
						this.stop().animate("attackRight", 13, 1);
				}*/

				this.attackCounter = 0;
				
				// Shot goes here
				this.shoot();
			}
			this.attackCounter++;		
		}
});

// Auto Attack
// Auto attack the first target in range
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("AutoAttack",
{
	init: function()
	{
		var self = this;

		this.bind("EnemyIsInRange", function(hitObj)
			{
				// Enemy will stop - for testing only
				// hitObj.unbind("EnterFrame", hitObj.move);

				if (self.state!=="Attacking")
				{
					if (self.state==="Moving")
					{
						self.stop();
						self.unbind("EnterFrame", self.move);
					}

					self.state = "Attacking";

					self.target = hitObj;
					
					// Bind the correct attack function
					if (self.mainAttack==="ShortRange")
						self.bind("EnterFrame", self.shortRangeAttack);
					else if (self.mainAttack==="LongRange")
						self.bind("EnterFrame", self.longRangeAttack);
				}
			});
	}
});


// Health Bar component
// Show the health status of each character
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("HealthBar",
{	

	init: function()
	{		
		this.healthBar = Crafty.e("2D, DOM, Color")
			.color('green')
			.attr({x: 0, y: 0, w: 0, h: 5})
			.css({boxShadow: 'inset 0 0 3px #ffffff', borderStyle:'solid', borderWidth:'1px', borderRadius: "15px", borderColor:'black'});

		var self = this;
		this.bind("HPChanged", function(amount)
			{
					self.currentHP-= amount;

					self.healthBar.attr({x: self.feet.x -this._BarSize()/2, w: this._BarSize()});
					self.healthBar.color(this._BarColor());
			})
	},
	
	createHealthBar: function()
	{
		this.healthBar.attr({x: this.feet.x - this._BarSize()/2, y: this.feet.y + 3, w: this._BarSize(), h: 5, z: 2});

		this.attach(this.healthBar);

		return this;
	},

	_BarSize: function()
	{
		return this.currentHP*.35; 
	},

	_BarColor: function()
	{
		var dmgPercent = this.currentHP/this.maxHP
		if(dmgPercent > .50)
			return 'green';
		else if(dmgPercent > .25)
			return '#CFBA25';
		else if(dmgPercent > 0)
			return 'red';
	}
});