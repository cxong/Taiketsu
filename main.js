var windowSize = { x: 480, y: 800 };
var game = new Phaser.Game(windowSize.x, windowSize.y, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var bg;
var enemyState = {
  counter: 0,
  state: "track"
};
var gameState = 'play';

var enemyY = 100;
var playerY = 700;
var player;
var enemy;

// Groups
// Create them ourselves because we need to control the Z order
var groups;

var music;

var cursors;


function preload () {
  game.load.image('bgimage', 'images/bg.jpg');
  game.load.image('block', 'images/block.png');
  game.load.image('bullet', 'images/bullet.png');
  game.load.image('bullet1', 'images/bullet1.png');
  
  //game.load.audio('bgaudio', 'audio/bg.mp3');
  
  //game.load.audio('collect', 'audio/collect.mp3');
  //game.load.audio('explode', 'audio/explode.mp3');
  //game.load.audio('explode', 'audio/fire.mp3');
  
  cursors = game.input.keyboard.createCursorKeys();
}

function create () {
  game.stage.backgroundColor = '0x000022';

  bg = game.add.sprite(0, 0, 'bgimage');
  
  //music = game.add.audio('bgaudio');
  //music.play('', 0, 0.3, true);
  
  groups = {
    player: game.add.group(),
    enemy: game.add.group(),
    playerBullets: game.add.group(),
    enemyBullets: game.add.group()
  };
 
  game.world.setBounds(0, 0, windowSize.x, windowSize.y);

  // Add players
  enemy = NewShip(game, groups.enemy, groups.enemyBullets, windowSize.x / 2, enemyY, -1);
  player = NewShip(game, groups.player, groups.playerBullets, windowSize.x / 2, playerY, 1);
  
  splash = null;
}

function update() {
  if (gameState === 'play') {
    // move player
    if (cursors.right.isDown) {
      player.moveRight();
    } else if (cursors.left.isDown) {
      player.moveLeft();
    }
    // move enemy
    if (game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      enemy.moveLeft();
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      enemy.moveRight();
    }
    
    // Collision
    game.physics.overlap(groups.enemy, groups.playerBullets, bulletHit);
    game.physics.overlap(groups.player, groups.enemyBullets, bulletHit);
  } else if (gameState === 'end') {
  }
}

function bulletHit(ship, bullet) {
  ship.damage(1);
  bullet.kill();
}
