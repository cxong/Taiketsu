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
  game.load.spritesheet('cockpit', 'images/cockpit.png', 38, 52);
  game.load.spritesheet('block0', 'images/block0.png', 11, 33);
  game.load.spritesheet('block1', 'images/block1.png', 38, 48);
  game.load.spritesheet('block2', 'images/block2.png', 16, 76);
  game.load.spritesheet('block3', 'images/block3.png', 29, 52);
  game.load.spritesheet('block4', 'images/block4.png', 22, 31);
  game.load.spritesheet('block5', 'images/block5.png', 10, 20);
  game.load.spritesheet('block6', 'images/block6.png', 26, 44);
  game.load.spritesheet('cockpita', 'images/cockpita.png', 38, 52);
  game.load.spritesheet('block0a', 'images/block0a.png', 11, 33);
  game.load.spritesheet('block1a', 'images/block1a.png', 38, 48);
  game.load.spritesheet('block2a', 'images/block2a.png', 16, 76);
  game.load.spritesheet('block3a', 'images/block3a.png', 29, 52);
  game.load.spritesheet('block4a', 'images/block4a.png', 22, 31);
  game.load.spritesheet('block5a', 'images/block5a.png', 10, 20);
  game.load.spritesheet('block6a', 'images/block6a.png', 26, 44);
  game.numBlocks = 7;
  // dictionary of blocks and delta for attachment, plus whether weapons are allowed
  game.blocks = {
    cockpit: { delta: 0, deltaNext: 8, isWeapon: true },
    block0: { delta: 0, deltaNext: 0, isWeapon: true },
    block1: { delta: -4, deltaNext: 4, isWeapon: true },
    block2: { delta: 29, deltaNext: 9, isWeapon: true },
    block3: { delta: 5, deltaNext: -6, isWeapon: false },
    block4: { delta: 4, deltaNext: -4, isWeapon: false },
    block5: { delta: 3, deltaNext: 3, isWeapon: true },
    block6: { delta: 8, deltaNext: 11, isWeapon: true }
  };
  game.load.image('bullet', 'images/bullet.png');
  game.load.image('bullet1', 'images/bullet1.png');
  // muzzle flashes
  game.load.image('flash0', 'images/flash0.png');
  game.load.image('flash1', 'images/flash1.png');
  game.load.image('flash2', 'images/flash2.png');
  game.load.image('flash3', 'images/flash3.png');
  game.numFlashes = 4;
  game.load.spritesheet('explosion', 'images/explosion.png', 34, 34);
  
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
  game.time.start = game.time.time;
  
  // Add players
  groups.enemy.removeAll();
  groups.player.removeAll();
  groups.playerBullets.removeAll();
  groups.enemyBullets.removeAll();
  NewShip(game, groups.enemy, groups.enemyBullets, windowSize.x / 2, enemyY, -1);
  NewShip(game, groups.player, groups.playerBullets, windowSize.x / 2, playerY, 1);
  groups.enemy.otherShip = groups.player;
  groups.player.otherShip = groups.enemy;
  
  // Remove text
  if (playerText !== null) {
    playerText.destroy(true);
  }
  playerText = null;
  if (enemyText !== null) {
    enemyText.destroy(true);
  }
  enemyText = null;
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
    if (game.time.time - game.time.start > 1000) {
      game.physics.overlap(groups.enemy, groups.playerBullets, bulletHit);
      game.physics.overlap(groups.player, groups.enemyBullets, bulletHit);
    }
    
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
    if (playerText === null || enemyText === null) {
      if (groups.enemy.countLiving() === 0) {
        playerText = game.add.text(game.world.centerX, playerY, winText, winStyle);
        enemyText = game.add.text(game.world.centerX, enemyY, loseText, loseStyle);
      } else if (groups.player.countLiving() === 0) {
        playerText = game.add.text(game.world.centerX, playerY, loseText, loseStyle);
        enemyText = game.add.text(game.world.centerX, enemyY, winText, winStyle);
      }
      playerText.anchor.x = 0.5;
      playerText.anchor.y = 0.5;
      enemyText.anchor.x = 0.5;
      enemyText.anchor.y = 0.5;
    }
  }
}

function killPart(part) {
  part.kill();
  explodeSound.play();
  for (var i = 0; i < 5; i++) {
    var explode = game.add.sprite(
      part.x + part.group.x, part.y + part.group.y, 'explosion');
    explode.anchor.x = 0.5;
    explode.anchor.y = 0.5;
    explode.body.velocity.x = (Math.random() - 0.5)*part.width*3;
    explode.body.velocity.y = (Math.random() - 0.5)*part.width*3;
    var anim = explode.animations.add('play');
    anim.killOnComplete = true;
    anim.play(Math.random()*10 + 10);
  }
  // update group bounds
  part.group.minDx = 0;
  part.group.maxDx = 0;
  part.group.forEachAlive(function(part) {
    part.group.minDx = Math.min(part.group.minDx, part.x - Math.abs(part.width) * 0.5);
    part.group.maxDx = Math.max(part.group.maxDx, part.x + Math.abs(part.width) * 0.5);
  });
  // Scale up DPS of remaining parts
  part.group.forEachAlive(function(p) {
    p.shot.scaleUpDPS(Math.abs(part.width));
  });
  if (part.childLeft !== null && part.childLeft.alive) {
    killPart(part.childLeft);
  }
  if (part.childRight !== null && part.childRight.alive) {
    killPart(part.childRight);
  }
  // If final part left, power up more
  if (part.group.countLiving() === 1) {
    var cockpit = part.group.getFirstAlive();
    cockpit.shot.scaleUpDPS(150);
    // Reduce hit box too
    cockpit.body.width *= 0.5;
    cockpit.body.height *= 0.5;
  }
}
