var windowSize = { x: 480, y: 800 };
var game = new Phaser.Game(windowSize.x, windowSize.y, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var bg;
var gameState = 'play';
var stateCounter = 0;

var enemyY = 100;
var playerY = 700;
var enemyText = null;
var playerText = null;

// Groups
// Create them ourselves because we need to control the Z order
var groups;

var music;
var explodeSound;

var cursors;


function preload () {
  game.load.image('bgimage', 'images/bg.jpg');
  game.load.spritesheet('block', 'images/block.png', 32, 32);
  game.load.image('bullet', 'images/bullet.png');
  game.load.image('bullet1', 'images/bullet1.png');
  
  //game.load.audio('bgaudio', 'audio/bg.mp3');
  
  //game.load.audio('collect', 'audio/collect.mp3');
  game.load.audio('explode', 'audio/explode.wav');
  game.load.audio('shot', 'audio/shot.wav');
  game.load.audio('hit', 'audio/hit.wav');
  
  cursors = game.input.keyboard.createCursorKeys();
}

function create () {
  game.stage.backgroundColor = '0x000022';

  bg = game.add.sprite(0, 0, 'bgimage');
  
  //music = game.add.audio('bgaudio');
  //music.play('', 0, 0.3, true);
  explodeSound = game.add.audio('explode');
  
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
  groups.enemy.removeAll();
  groups.player.removeAll();
  NewShip(game, groups.enemy, groups.enemyBullets, windowSize.x / 2, enemyY, -1);
  NewShip(game, groups.player, groups.playerBullets, windowSize.x / 2, playerY, 1);
  groups.enemy.otherShip = groups.player;
  groups.player.otherShip = groups.enemy;
  
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
      groups.player.moveRight();
    } else if (cursors.left.isDown) {
      groups.player.moveLeft();
    }
    // move enemy
    if (game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      groups.enemy.moveLeft();
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      groups.enemy.moveRight();
    }
    
    // Collision
    game.physics.overlap(groups.enemy, groups.playerBullets, bulletHit);
    game.physics.overlap(groups.player, groups.enemyBullets, bulletHit);
    
    groups.player.fireAndAI();
    groups.enemy.fireAndAI();
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
  ship.takeHit();
  
  if (!ship.alive) {
    // Recursively kill this part and its children
    killPart(ship);
  }
  
  // Check victory conditions
  if (groups.player.countLiving() === 0 || groups.enemy.countLiving() === 0) {
    gameState = 'end';
    stateCounter = 60;
  
    var winStyle = { font: "48px Arial", fill: "#00ff44", align: "center" };
    var loseStyle = { font: "48px Arial", fill: "#ff0044", align: "center" };
    var winText = "A winner!";
    var loseText = "Pleased to try again";

    // Display winning texts
    if (groups.enemy.countLiving() === 0) {
      playerText = game.add.text(game.world.centerX, playerY, winText, winStyle);
      enemyText = game.add.text(game.world.centerX, enemyY, loseText, loseStyle);
    } else if (groups.player.countLiving() === 0) {
      playerText = game.add.text(game.world.centerX, playerY, loseText, loseStyle);
      enemyText = game.add.text(game.world.centerX, enemyY, winText, winStyle);
    }
    playerText.anchor.x = 0.5;
    enemyText.anchor.x = 0.5;
  }
}

function killPart(part) {
  part.kill();
  explodeSound.play();
  if (part.childPart !== null && part.childPart.alive) {
    killPart(part.childPart);
  }
}
