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
var speedBase = 7;

// Groups
// Create them ourselves because we need to control the Z order
var groups;

var music;

var cursors;


function preload () {
  //game.load.image('bgimage', 'images/bg.jpg');
  game.load.image('block', 'images/block.png');
  
  //game.load.audio('bgaudio', 'audio/bg.mp3');
  
  //game.load.audio('collect', 'audio/collect.mp3');
  //game.load.audio('explode', 'audio/explode.mp3');
  //game.load.audio('explode', 'audio/fire.mp3');
  
  cursors = game.input.keyboard.createCursorKeys();
}

function create () {
  game.stage.backgroundColor = '0x000022';

  //bg = game.add.sprite(0, statusHeight, 'bgimage');
  
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
  enemy = game.add.sprite(windowSize.x / 2, enemyY, 'block');
  groups.enemy.add(enemy);
  player = game.add.sprite(windowSize.x / 2, playerY, 'block');
  groups.player.add(player);
  
  splash = null;
}

function update() {
  if (gameState === 'play') {
    // move player
    if (cursors.right.isDown) {
      player.x += speedBase;
    } else if (cursors.left.isDown) {
      player.x -= speedBase;
    }
  } else if (gameState === 'end') {
  }
}
