/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tuxemon, https://github.com/Tuxemon/Tuxemon
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

function preload() {
  // We'll use a tileset generated using the program Tiled.
  this.load.image("tiles", "assets/map/citytileset.png");
  this.load.tilemapTiledJSON("map", "assets/map/tileset.json");
  this.load.spritesheet('ish', 'assets/sprites/ish.png', { frameWidth: 16, frameHeight: 26 });
}


function create() {
  const map = this.make.tilemap({ key: "map" });

  // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
  // Phaser's cache (i.e. the name you used in preload)
  const tileset = map.addTilesetImage("city", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const floorLayer = map.createStaticLayer("Floor", tileset, 0, 0);
  const decorLayer = map.createStaticLayer("Decorations", tileset, 0, 0);
  const solidLayer = map.createStaticLayer("Solid objects", tileset, 0, 0);
  const belowLayer = map.createStaticLayer("Below player", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above player", tileset, 0, 0);

  solidLayer.setCollisionByProperty({ collides: true });

  // By default, everything gets depth sorted on the screen in the order we created things. Here, we
  // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
  // Higher depths will sit on top of lower depth objects.
  aboveLayer.setDepth(10);

  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
  
  player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "ish", "face-down");

  // Create a sprite with physics enabled via the physics system. The image used for the sprite has
  // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
  

  // Watch the player and worldLayer for collisions, for the duration of the scene:
  player.body.setSize(16, 16).setOffset(0, 10);
  this.physics.add.collider(player, solidLayer);

  // Create the player's walking animations from the texture atlas. These are stored in the global
  // animation manager so any sprite can access them.
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
    frames: [ { key: 'ish', frame: 1 } ],
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

  const camera = this.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, 224*16, 16*16);

  cursors = this.input.keyboard.createCursorKeys();
}



function update(time, delta) {
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.anims.play("right", true);
  } else if (cursors.up.isDown) {
    player.anims.play("up", true);
  } else if (cursors.down.isDown) {
    player.anims.play("down", true);
  } else {
    player.anims.stop();

    // If we were moving, pick an idle frame to use
    if (prevVelocity.x < 0) player.anims.play("face-left", true);
    else if (prevVelocity.x > 0) player.anims.play("face-right", true);
    else if (prevVelocity.y < 0) player.anims.play("face-up", true);
    else if (prevVelocity.y > 0) player.anims.play("face-down", true);
  }
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

function popUp(message) {
  // TODO: Figure out how to add pop-up text boxes
}