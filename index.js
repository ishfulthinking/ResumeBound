/*
  This is an interactive resume by Ishmael Perez for ScholarJet and Akamai's
  "Code Your Resume" contest. I hope you enjoy!

  BIG shout out to Michael Hadley (mikewesthad.com) for his great guide on
  using Phaser 3 to make a Pokemon-like HTML5 game like this.
*/

const config = {
  type: Phaser.AUTO,
  // We want the game to be 32x16 tiles wide, and each tile is 16px large.
  width: 32 * 16,
  height: 16 * 16,
  zoom: 2,
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let showDebug = false;
let rate = 5;
let speed = 90;
let logo;
let popUpMessage;

let coffeeFlag = false;

function preload() {
  // We'll use a tileset generated using the program Tiled.
  this.load.image("tiles", "assets/map/citytileset.png");
  this.load.tilemapTiledJSON("map", "assets/map/tileset.json");
  this.load.spritesheet('ish', 'assets/sprites/ish.png', { frameWidth: 16, frameHeight: 26 });
  // TODO: Make a splash image: this.load.image("logo", "assets/sprites/resumebound.png");
}


function create() {
  const map = this.make.tilemap({ key: "map" });
  const tileset = map.addTilesetImage("city", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const floorLayer = map.createStaticLayer("Floor", tileset, 0, 0);
  const decorLayer = map.createStaticLayer("Decorations", tileset, 0, 0);
  const solidLayer = map.createStaticLayer("Solid objects", tileset, 0, 0);
  const belowLayer = map.createStaticLayer("Below player", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above player", tileset, 0, 0);

  // Only one layer actually collides with the player.
  solidLayer.setCollisionByProperty({ collides: true });
  // And only one other layer will appear "above" the player.
  aboveLayer.setDepth(10);

  // Make the player spawn in the spawn point by getting the info from the Tiled file's Objects layer.
  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
  player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "ish", "face-up");

  // Show the ResumeBound logo.
  logo = this.physics.add.sprite(0, 0, "")

  // Set a 16x16 collision box 10 pixels below the top-left of the player.
  player.body.setSize(16, 16).setOffset(0, 10);
  this.physics.add.collider(player, solidLayer);

  // Create the walking animations.
  const anims = this.anims;

  anims.create({
    key: 'down',
    frames: this.anims.generateFrameNumbers('ish', { start: 0, end: 3 }),
    frameRate: rate,
    repeat: -1
  });
  anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('ish', { start: 4, end: 7 }),
    frameRate: rate,
    repeat: -1
  });
  anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('ish', { start: 8, end: 11 }),
    frameRate: rate,
    repeat: -1
  });
  anims.create({
    key: 'up',
    frames: this.anims.generateFrameNumbers('ish', { start: 12, end: 15 }),
    frameRate: rate,
    repeat: -1
  });

  // Make animations for standing still, too.
  this.anims.create({
    key: 'face-down',
    frames: [ { key: 'ish', frame: 0 } ],
    frameRate: 20
  });
  this.anims.create({
    key: 'face-left',
    frames: [ { key: 'ish', frame: 5 } ],
    frameRate: 20
  });
  this.anims.create({
    key: 'face-right',
    frames: [ { key: 'ish', frame: 9 } ],
    frameRate: 20
  });
  this.anims.create({
    key: 'face-up',
    frames: [ { key: 'ish', frame: 13 } ],
    frameRate: 20
  });
  this.anims.create({
    key: 'yahoo',
    frames: [ { key: 'ish', frame: 16 } ],
    frameRate: 20
  });

  // Make the camera follow along with the player as they walk, and sets its bounds to the map.
  // That way we don't have "the void" show up -- the camera just scrolls along horizontally.
  const camera = this.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, 224*16, 16*16);

  // Enable player input.
  cursors = this.input.keyboard.createCursorKeys();

  // TODO: Add event flags: coffee, hot dog, CAS, Siemens, portfolio bridge, Cambridge, languages, and Akamai.
}



function update(time, delta) {
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

  // Movement based on the arrow keys.
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }
  // Normalize and scale the velocity so that player doesn't move faster along a diagonal.
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown)
    player.anims.play("left", true);
  else if (cursors.right.isDown)
    player.anims.play("right", true);
  else if (cursors.up.isDown)
    player.anims.play("up", true);
  else if (cursors.down.isDown)
    player.anims.play("down", true);
  else {
    player.anims.stop();

    // If we were moving, pick an idle frame to use
    if (prevVelocity.x < 0) 
      player.anims.play("face-left", true);
    else if (prevVelocity.x > 0) 
      player.anims.play("face-right", true);
    else if (prevVelocity.y < 0)
      player.anims.play("face-up", true);
    else if (prevVelocity.y > 0)
      player.anims.play("face-down", true);
  }
}

function popUp(instance, message) {
  // TODO: Put pop-up speech bubbles whenever x is between two values
  // so that the on-screen info can be explained in detail.
}


function powerUp(type) {
  if (type === "coffee") {
    speed += 50;
    rate += 3;
    popUp("+10 energy");
  }
  else if (type === "food") {
    popUp("-10 hunger");
  }
  else if (type === "education") {
    popUp("+100 intelligence");
  }
  else if (type === "akamai") {
    popUp("+1 work opportunity");
  }
}



function drink(player, drink) {
  drink.kill();
  powerUp("coffee");
}
/*
function confetti() {
  let emitter = game.add.emitter( this.home_location.x + ( this.width / 2 ), this.home_location.y, 100 );
  emitter.makeParticles( 'confetti', [ 0, 1, 2, 3 ] );
  emitter.y = emitter.y + ( this.tile_size * 2 );
  emitter.width = this.home_location.width - this.tile_size;
  emitter.height = this.tile_size;
  emitter.setYSpeed( 20, 40 );
  emitter.setXSpeed( 0, 0 );
  emitter.gravity = 0;
  this.groupElements.add( emitter );

  emitter.start( false, 1500, 70 );
}
*/