// Player component
// Include all the components for each player
Crafty.c("Player",
	{
		init: function()
		{
			/*
			this.soldiers = new Array();
			this.numOfSoldiers = 0;

			this.towers = new Array();
			this.numOfTowers = 0;
			*/
		},

		createUnit: function(card)
		{
			var obj = Crafty.e("SpriteAnimation, "+card.unit.component);

			obj.attr(card.unit.value);

			switch (card.unit.type)
			{
				case "soldier":
				{
					obj.attr({x: card.x + card.w/2 - obj.w/2,
								y: card.y + card.h/2 - obj.h/2,
								z: obj.y + obj.h});

					obj.animate("walkLeft", card.unit.code*3, 1, card.unit.code*3+2)
						.animate("walkRight", card.unit.code*3, 2, card.unit.code*3+2)
						.animate("attackLeft", card.unit.code*3, 1, card.unit.code*3+2)
						.animate("attackRight", card.unit.code*3, 2, card.unit.code*3+2);

					obj.Utilities();

					obj.createHealthBar();
					obj.createAttackArea();

					obj.autoMove();

					break;
				}

				case "tower":
				{
					obj.attr({x: card.x + card.w/2 - obj.w/2,
								y: card.y + card.h/2 - obj.h/2 - 6,
								z: obj.y + obj.h});

					obj.Utilities();

					obj.createHealthBar();
					obj.createAttackArea();

					// The tower occupies a slot
					obj.slot = card.slot;

					break;
				}
			};
		}
	});

// Resource Bar component
// Show the resource status of the player
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("ResourceBar",
{	
	init: function()
	{		
		this.requires("2D, Color")
			.css({boxShadow: 'inset 0 0 3px #ffffff', borderStyle:'solid', borderWidth:'1px', borderRadius: "15px", borderColor:'black'});

		var self = this;
		this.bind("EnterFrame", function()
			{
				if (self.counter>=10)
				{
					if (self.currentResource<self.maxResource)
					{
						self.trigger("ResourceChanged", 1);

						self.counter = 0;
					}
				}
				else
					self.counter++;
			});
		this.bind("ResourceChanged", function(amount)
			{
				self.currentResource += amount;

				self.w = self._BarSize();
				self.color(self._BarColor());

				self.resourceText.attr({x: self.x + self.w/2 - 4, y: self.y});
				self.resourceText.text(self.currentResource);
			});
	},
	
	Resource: function(amount)
	{
		this.maxResource = amount;
		this.currentResource = 100;

		this.w = this._BarSize();

		this.resourceText = Crafty.e("2D, DOM, Text");
		this.resourceText.attr({x: this.x + this.w/2 - 4, y: this.y});
		this.resourceText.text(this.currentResource);

		//this.resourceText.textColor("#FFFFFF");
		this.color(this._BarColor());

		this.counter = 0;

		return this;
	},

	_BarSize: function()
	{
		return (this.currentResource/this.maxResource)*110; 
	},

	_BarColor: function()
	{
		var percent = this.currentResource/this.maxResource;
		if(percent > .50)
		{
			this.resourceText.textColor("#FFFFFF");
			return 'green';
		}
		else if(percent > .25)
		{
			this.resourceText.textColor("#000000");
			return 'yellow';
		}
		else if(percent > 0)
		{
			this.resourceText.textColor("#FFFFFF");
			return 'red';
		}
	}
});

// Slot component
// The slot to put cards in
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("Slot",
{
	init: function()
	{
		this.requires("2D, Image, Mouse");

		// When created the first time, the slot is available
		this.makeAvailable();
	},

	hightlight: function()
	{
		this.image("images/tile_mouse_over.png");
	},

	unHighlight: function()
	{
		this.image("images/tile.png");
	},

	makeAvailable: function()
	{
		this.available = true;
		this.bind("MouseOver", this.hightlight)
			.bind("MouseOut", this.unHighlight)
			.bind("CardDragged", this.whenCardDragged)
			.bind("CardSet", this.whenCardSet);
	},

	makeUnavailable: function()
	{
		this.available = false;
		this.unHighlight();
		this.unbind("MouseOver")
			.unbind("MouseOut")
			.unbind("CardDragged")
			.unbind("CardSet");
	},

	whenCardDragged: function(mousePos)
	{
		// Check if mouse is over the slot
		if (this.isAt(mousePos.x, mousePos.y))
		{
			this.hightlight();
		}
		else
		{
			this.unHighlight();
		}
	},

	whenCardSet: function(obj)
	{
		var card = obj.card;
		var mousePos = obj.mousePos;

		// Check if the card is not set, and mouse is over the slot, and there is enough resources
		if (card.isSet === false && this.isAt(mousePos.x, mousePos.y)
			&& this.player.resource.currentResource>=card.resource)
		{
			this.player.resource.trigger("ResourceChanged", -card.resource);

			// Set the card to slot
			card.setCard(this);
		}
		else if (card.isSet === false)
		{
			card.returnToHand();
		}
	}
});

// Card component
// The individual card
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("Card",
	{
		init: function()
		{
			this.requires("2D, Mouse, Draggable, Image");

			//Card is created in Hand first, so isSet value = false
			this.isSet = false;

			var self = this;

			this.bind("MouseOver", function()
				{
					self.highlight();
				});

			this.bind("MouseOut", function()
				{
					self.unHighlight();
				});

			this.bind("MouseDown", function()
				{
					self.startDrag();
					self.z = 1000;
				});

			this.bind("MouseUp", function(e)
				{
					var mousePos = Crafty.DOM.translate(e.clientX, e.clientY);

					// Return all the slots in the game
					var allSlots = Crafty("Slot");

					// Find the slot that has the mouse over
					for (var i=0; i<allSlots.length; i++)
						if (Crafty(allSlots[i+'']).player===self.player)
						{
							Crafty(allSlots[i+'']).trigger("CardSet", {mousePos: mousePos, card: self});
						}

					self.stopDrag();

					if (!this.isSet)
						this.returnToHand();
				});

			this.bind("Dragging", function(e)
				{
					var mousePos = Crafty.DOM.translate(e.clientX, e.clientY);

					// Return all the slots in the game
					var allSlots = Crafty("Slot");

					// Find the slot that has the mouse over
					for (var i=0; i<allSlots.length; i++)
						if (Crafty(allSlots[i+'']).player===self.player)
						{
							Crafty(allSlots[i+'']).trigger("CardDragged", mousePos);
						}
				});
		},

		// Set the card to slot
		setCard: function(slot)
		{
			// The slot becomes unavailable
			slot.makeUnavailable();

			this.slot = slot;

			// Update the current position of the card
			this.x = slot.x;
			this.y = slot.y;
			this.z = 0;

			// The card can't be moved
			this.makeUnavailable();

			// Make changes to the Hand
			this.hand.shiftCards();
			this.hand.drawACard();

			// Be prepare to deploy units
			this.bind("EnterFrame", this.deploy);
		},

		setPosition: function(_x, _y)
		{
			// The current location
			this.x = _x;
			this.y = _y;

			// The location in the Hand
			this.originalX = _x;
			this.originalY = _y;
		},

		returnToHand: function()
		{
			this.x = this.originalX;
			this.y = this.originalY;
			this.z = 1;
		},

		highlight: function()
		{
			this.image("images/card_"+this.name+"_mouse_over.png");
		},

		unHighlight: function()
		{
			this.image("images/card_"+this.name+".png");
		},

		makeUnavailable: function()
		{
			this.isSet = true;
			this.unbind("MouseDown")
				.unbind("MouseUp")
				.unbind("Dragging");
		},

		deploy: function()
		{
			if (this.deployTime<=0)
			{
				// Find the current player
				var currentPlayer = this.player;

				currentPlayer.createUnit(this);

				this.unbind("EnterFrame", this.deploy);

				// If the unit is a soldier, the slot becomes available
				if (this.unit.type==="soldier")
					this.slot.makeAvailable();

				// The card is destroyed after the unit is deployed
				this.destroy();
			}
			else
			{
				this.deployTime--;
			}
		}
	});


// Hand component
// The card Hand of each player
//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
Crafty.c("Hand",
{
	init: function()
	{
		this.requires("2D");

		// For testing
		// this.soldierCount = 0;
	},

	Hand: function(number)
	{
		this.cards = new Array();

		for (var i = 0; i < number; i++)
		{
			this.drawACard();
		}

		return this;
	},

	randomCard: function(aCard)
	{
		aCard.attr({z: 1});

		var n = Crafty.math.randomInt(1, 100);

		if (n<=80)
		{
			// For testing
			//aCard.count = ++this.soldierCount;

			aCard.name ="soldier";
			aCard.image("images/card_"+aCard.name+".png?"+new Date().getTime());

			aCard.deployTime = 40;
			aCard.resource = 20;

			// Add all the value relating to the unit created from the card
			aCard.unit = new Object();
			aCard.unit.component = "Utilities, ShortRangeAttack, AutoMove, HealthBar, soldier2";
			aCard.unit.value = {player: aCard.player,
							mainAttack: "ShortRange",
							maxHP: Crafty.math.randomInt(50, 130),
							movingSpeed: Crafty.math.randomInt(0.9, 1.2),
							attack: Crafty.math.randomInt(3, 6), attackInterval: Crafty.math.randomInt(10, 40), attackRange: 3};
			aCard.unit.type = "soldier";
			aCard.unit.code = 2;
		}
		else
		{
			aCard.name = "tower";
			aCard.image("images/card_"+aCard.name+".png?"+new Date().getTime());

			aCard.deployTime = 90;
			aCard.resource = 50;

			// Add all the value relating to the unit created from the card
			aCard.unit = new Object();
			aCard.unit.component = "Utilities, LongRangeAttack, HealthBar";
			if (aCard.player.side===1)
			{
				aCard.unit.component = aCard.unit.component + ", tower0";
				aCard.unit.code = 0;
			}
			else
			{
				aCard.unit.component = aCard.unit.component + ", tower1";
				aCard.unit.code = 1;
			}
			aCard.unit.value = {player: aCard.player,
						mainAttack: "LongRange",
						maxHP: 200,
						attack: 20, attackInterval: 100, attackRange: 200};
			aCard.unit.type = "tower";
		}
	},

	drawACard: function()
	{
		var aCard = Crafty.e("DOM, Card");

		aCard.player = this.player;

		aCard.setPosition(this.x + this.cards.length * 63, this.y);

		// Set random value to this card
		this.randomCard(aCard);
		
		aCard.hand = this;

		this.cards.push(aCard);
	},

	// Shift cards to the left and draw a new card
	shiftCards: function()
	{
		var pos = this.cards.length, i = 0;
		
		while (i < this.cards.length)
		{
			// Find the first empty position
			if (this.cards[i]===undefined || this.cards[i].isSet)
			{
				pos = i;

				// Find the first card that is still on the Hand
				var j = i+1;
				while (j < this.cards.length)
				{
					if (this.cards[j]!==undefined && !this.cards[j].isSet)
					{
						break;
					}

					j++;
				}

				if (j >= this.cards.length)
					break;

				// Shift left
				var left = this.cards[pos];
				var right = this.cards[j];

				// Change the position first
				right.setPosition(this.x + pos * 63, this.y);

				// The shift the card in the array
				this.cards[pos] = right;
				this.cards[j] = undefined;
			}

			i++;
		}
		this.cards.pop();
	}
});