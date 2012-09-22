window.onload = function()
{
	WIDTH = 900, HEIGHT = 480;

	// Initialize the game scene
	Crafty.init(WIDTH, HEIGHT);
	Crafty.background("#3F5F29");
	
	// Sprite

	Crafty.sprite(32, "images/Monster_Sprites.png",
	{
		soldier0: [1, 0],
		soldier1: [4, 0],
		soldier2: [7, 0],
		soldier3: [10, 0]
	});

	Crafty.sprite(58, "images/Tower_Sprites.png",
	{
		tower0: [2, 1],
		tower1: [2, 0]
	});

	// Map Setting
	//*******************************************************************************************
	//*******************************************************************************************
	//*******************************************************************************************
	// Currently nothing

	// Game Setting
	//*******************************************************************************************
	//*******************************************************************************************
	//*******************************************************************************************

	// Left Player
	//*******************************************************************************************
	//*******************************************************************************************
	//*******************************************************************************************
	var leftPlayer = Crafty.e("Player")
		.attr({side: 1});

	// Create slots for each player
	var startX = 25, startY = 20;

	leftPlayer.slots = new Array();

	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 3; j++)
		{
			// Need to add ? and a unique number behind
			// to avoid caching the same image
			// so the next image can be loaded
			var aSlot = Crafty.e("DOM, Slot")
					.image("images/tile.png?"+new Date().getTime())
					.attr({x: j * 59 + startX, y: i * 71 + startY, player: leftPlayer});
			leftPlayer.slots.push(aSlot);
		}

	leftPlayer.Hand = Crafty.e("Hand")
			.attr({x: WIDTH/4 - 200, y: HEIGHT - 120, player: leftPlayer})
			.Hand(5);

	leftPlayer.resource = Crafty.e("DOM, ResourceBar")
		.attr({x: WIDTH/4 - 200, y: HEIGHT - 45, w: 0, h: 11})
		.Resource(100);

	// Right Player
	//*******************************************************************************************
	//*******************************************************************************************
	//*******************************************************************************************
	var rightPlayer = Crafty.e("Player")
		.attr({side: -1});

	// Create slots for each player
	startX = WIDTH - 205, startY = 20;

	rightPlayer.slots = new Array();

	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 3; j++)
		{
			var aSlot = Crafty.e("DOM, Slot")
					.image("images/tile.png?"+new Date().getTime())
					.attr({x: j * 59 + startX, y: i * 71 + startY, player: rightPlayer});
			rightPlayer.slots.push(aSlot);
		}

	rightPlayer.Hand = Crafty.e("Hand")
			.attr({x: WIDTH - 337, y: HEIGHT - 120, player: rightPlayer})
			.Hand(5);

	rightPlayer.resource = Crafty.e("DOM, ResourceBar")
		.attr({x: WIDTH - 135, y: HEIGHT - 45, w: 0, h: 11})
		.Resource(100);
};