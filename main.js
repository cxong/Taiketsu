var windowSize = { x: 480, y: 800 };
var game = new Phaser.Game(windowSize.x, windowSize.y, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var bg;
var gameState = 'play';
var stateCounter = 0;

var enemyY = 100;
var playerY = 700;
var player = null;
var enemy = null;
var enemyText = null;
var playerText = null;

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
  
  reset();
  
  splash = null;
}

function reset() {
  gameState = 'play';
  
  // Add players
  if (enemy !== null) {
    enemy.destroy(true);
  }
  enemy = NewShip(game, groups.enemy, groups.enemyBullets, windowSize.x / 2, enemyY, -1);
  if (player !== null) {
    player.destroy(true);
  }
  player = NewShip(game, groups.player, groups.playerBullets, windowSize.x / 2, playerY, 1);
  enemy.otherShip = player;
  player.otherShip = enemy;
  
  // Remove text
  if (playerText !== null) {
    playerText.destroy(true);
  }
  if (enemyText !== null) {
    enemyText.destroy(true);
  }
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
    stateCounter--;
    if (stateCounter <= 0) {
      if (game.input.keyboard.isDown(Phaser.Keyboard.A) ||
          game.input.keyboard.isDown(Phaser.Keyboard.D) ||
          cursors.right.isDown ||
          cursors.left.isDown) {
        reset();
      }
    }
  }
}

function bulletHit(ship, bullet) {
  ship.damage(1);
  bullet.kill();
  
  // Check victory conditions
  if (!player.alive || !enemy.alive) {
    gameState = 'end';
    stateCounter = 60;
  
    var winStyle = { font: "48px Arial", fill: "#00ff44", align: "center" };
    var loseStyle = { font: "48px Arial", fill: "#ff0044", align: "center" };
    var winText = "A winner!";
    var loseText = "Pleased to try again";

    // Make remaining player invincible
    if (player.alive) {
      player.health = 100;
      playerText = game.add.text(game.world.centerX, playerY, winText, winStyle);
      enemyText = game.add.text(game.world.centerX, enemyY, loseText, loseStyle);
    } else if (enemy.alive) {
      enemy.health = 100;
      playerText = game.add.text(game.world.centerX, playerY, loseText, loseStyle);
      enemyText = game.add.text(game.world.centerX, enemyY, winText, winStyle);
    }
    playerText.anchor.x = 0.5;
    enemyText.anchor.x = 0.5;
  }
}
