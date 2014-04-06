function NewShip(game, group, bulletGroup, x, y, yscale, otherShip) {
  group.x = x;
  group.y = y;
  var shot = new Shot(game, group, bulletGroup, yscale, 2.0);
  shot.scaleUpDPS(150);
  var ship = NewShipPart(game, group, 'cockpit' + (yscale < 0 ? 'a' : ''), null, false, shot,
                         0, 0, yscale);
  // Add more ship parts
  var i;
  var childLeft = ship;
  var childRight = ship;
  var lastDy = game.blocks.cockpit.deltaNext * yscale * -1;
  var powerBudget = 5;
  var wasLastNonWeapon = false;
  for (i = 1; powerBudget > 0; i++) {
    // Scale shot power down by distance from center, and up by part size
    var spritename = null;
    while (spritename === null) {
      // if we used a non-weapon part last, we need to use a weapon part
      spritename = 'block' + Math.floor(Math.random() * game.numBlocks);
      if (wasLastNonWeapon && !game.blocks[spritename].isWeapon) {
        spritename = null;
      }
    }
    var shotPower = 1.0 / Math.sqrt(i) * game.cache.getImage(spritename).width / 30;
    if (!game.blocks[spritename].isWeapon) {
      shotPower = 0;
      wasLastNonWeapon = true;
    }
    powerBudget -= shotPower;
    shot = new Shot(game, group, bulletGroup, yscale, shotPower);
    childLeft = NewShipPart(game, group, spritename + (yscale < 0 ? 'a' : ''), childLeft, true, shot,
                            childLeft.x - childLeft.width / 2,
                            childLeft.y + lastDy, yscale);
    childLeft.x -= childLeft.width / 2;
    childLeft.y += game.blocks[spritename].delta * yscale * -1;
    childRight = NewShipPart(game, group, spritename + (yscale < 0 ? 'a' : ''), childRight, false, shot.clone(),
                             childRight.x + Math.abs(childRight.width) / 2,
                             childRight.y + lastDy, yscale);
    childRight.x += Math.abs(childRight.width) / 2;
    childRight.y += game.blocks[spritename].delta * yscale * -1;
    lastDy = game.blocks[spritename].deltaNext * yscale * -1;
  }
  // Track left/right bounds
  group.minDx = 0;
  group.maxDx = 0;
  group.forEachAlive(function(part) {
    group.minDx = Math.min(group.minDx, part.x - Math.abs(part.width) * 0.5);
    group.maxDx = Math.max(group.maxDx, part.x + Math.abs(part.width) * 0.5);
  });
  
  var speedBase = 5;
  group.getSpeed = function() {
    return speedBase / Math.sqrt(this.countLiving());
  };
  group.move = function(dir, resetAI) {
    if (resetAI) {
      this.useAI = false;
      this.useAICounter = 100;
    }
    this.x += dir;
    this.x = Math.min(Math.max(this.x, -this.minDx),
                      game.world.bounds.width - this.maxDx);
  };
  group.moveLeft = function() {
    this.move(-this.getSpeed(), true);
  };
  group.moveRight = function() {
    this.move(this.getSpeed(), true);
  };
 
  // Use AI
  // If not controlled by player for a while, auto-engage AI
  group.useAI = true;
  group.useAICounter = 0;
  group.aiCounter = 0;
  group.aiState = 'track'; // track: move to aim at player, left/right: move in direction
  group.otherShip = null;
  
  group.fireAndAI = function() {
    if (this.countLiving() === 0) {
      return;
    }
    
    // Use AI
    if (this.useAI) {
      if (this.aiState == 'track') {
        // track the other ship
        if (this.otherShip !== null) {
          var xDiff = this.otherShip.x - this.x;
          xDiff = Math.min(Math.max(xDiff, -this.getSpeed()), this.getSpeed());
          this.move(xDiff, false);
        }
      } else if (this.aiState == 'left') {
        this.move(-this.getSpeed(), false);
      } else if (this.aiState == 'right') {
        this.move(this.getSpeed(), false);
      }
      this.aiCounter--;
      if (this.aiCounter <= 0) {
        this.aiCounter = Math.random() * 20 + 10;
        // Randomly change AI state
        var state = Math.floor(Math.random() * 4);
        switch (state) {
          case 0:
          case 1:
            this.aiState = 'track';
            break;
          case 2:
            this.aiState = 'left';
            break;
          case 3:
            this.aiState = 'right';
            break;
        }
      }
    } else {
      this.useAICounter--;
      if (this.useAICounter <= 0) {
        this.useAI = true;
      }
    }
  };
}

function NewShipPart(game, group, name, parent, isLeft, shot, x, y, yscale) {
  var part = game.add.sprite(x, y, name);
  part.anchor.x = 0.5;
  part.anchor.y = 0.5;
  part.height *= yscale;
  group.add(part);
  
  // Parent/child
  part.parentPart = parent;
  part.childLeft = null;
  part.childRight = null;
  if (parent !== null) {
    if (isLeft) {
      parent.childLeft = part;
    } else {
      parent.childRight = part;
      part.width *= -1;
    }
  }
  // Recursively add health
  part.addHealth = function(health) {
    this.health += health;
    if (this.parentPart !== null) {
      this.parentPart.addHealth(health);
    }
  };
  part.addHealth(10);
  part.fullHealth = part.health;
  
  // Firing
  part.shot = shot;
  part.flashSprite = game.add.sprite(x, y, 'flash' + Math.floor(Math.random() * game.numFlashes));
  part.flashSprite.anchor.x = 0.5;
  part.flashSprite.anchor.y = 1;
  part.flashSprite.height *= yscale;
  part.flashSprite.kill();

  // being hit
  var hit = game.add.audio('hit');
  part.hitCount = 0;
  part.takeHit = function() {
    hit.play();
    this.hitCount = 2;
    this.frame = 1;
  };
  
  // Flash to red frame if damaged
  part.damageCounter = 0;
  var damageFrameMax = 10;
  part.update = function() {
    if (!this.alive) {
      return;
    }
    if (this.shot.shoot(this)) {
      if (!this.flashSprite.alive) {
        this.flashSprite.revive(1);
        this.flashSprite.lifespan = 100;
      }
    }
    if (this.flashSprite.alive) {
      this.flashSprite.x = this.x + group.x;
      this.flashSprite.y = this.y + group.y - this.height / 2;
    }
    
    if (this.hitCount > 0) {
      this.hitCount--;
      if (this.hitCount === 0) {
        // switch sprite back
        this.frame = 0;
      }
    } else {
      // Update frame if taking damage
      var damagePct = (this.fullHealth - this.health) / this.fullHealth;
      if (damagePct * damageFrameMax > this.damageCounter) {
        this.frame = 2;
      } else {
        this.frame = 0;
      }
      this.damageCounter--;
      if (this.damageCounter <= 0) {
        this.damageCounter = damageFrameMax;
      }
    }
  };
  
  return part;
}

var Shot = function(game, group, bulletGroup, yscale, powerScale) {
  var shot = game.add.audio('shot');
  this.gunLocks = [];
  this.gunLock = Math.random() * 50 + 60;
  this.gunLockIndex = 0;
  this.spreadCount = 0;
  if (powerScale > 0) {
    // Randomly generate a set of gun locks
    var burstSize = Math.floor(Math.random() * 2 * powerScale) + 1;
    var burstLock = Math.floor((Math.random() * 20 + 4) / powerScale);
    var burstEndLock = Math.floor((Math.random() * 60 + 5 + burstLock) / powerScale);
    this.gunLocks = [];
    for (; burstSize > 0; burstSize--) {
      this.gunLocks.push(burstLock);
    }
    this.gunLocks.push(burstEndLock);
    this.shotSpeed = (Math.random() * 150 + 250) * Math.sqrt(powerScale);
    this.spreadCount = Math.floor(Math.random() * 2 * powerScale + 1);
    this.spreadWidth = Math.random() * 10 + 5;
  
    // Now calculate DPS and scale gun lock so DPS is equal
    var dps = 0;
    var i;
    for (i = 0; i < this.gunLocks.length; i++) {
      dps += Math.sqrt(this.spreadCount) / this.gunLocks[i];
    }
    var standardDps = 0.07;
    var dpsScale = dps / standardDps;
    for (i = 0; i < this.gunLocks.length; i++) {
      this.gunLocks[i] *= dpsScale;
    }
  }
  
  this.shoot = function(part) {
    if (powerScale === 0) {
      return false;
    }
    this.gunLock--;
    if (this.gunLock <= 0) {
      shot.play();
      var spreadStartAngle = -(this.spreadCount - 1) * this.spreadWidth / 2;
      var i;
      for (i = 0; i < this.spreadCount; i++) {
        var angle = spreadStartAngle + i * this.spreadWidth;
        bulletGroup.add(NewBullet(game,
                                  part.x + group.x,
                                  part.y + group.y - part.height / 2,
                                  yscale, angle, this.shotSpeed));
      }
      this.gunLock = this.gunLocks[this.gunLockIndex];
      this.gunLockIndex++;
      if (this.gunLockIndex >= this.gunLocks.length) {
        this.gunLockIndex = 0;
      }
      return true;
    }
    return false;
  };
  
  this.scaleUpDPS = function(scale) {
    var scaleFactor = Math.pow(0.8, scale / 35);
    var i;
    for (i = 0; i < this.gunLocks.length; i++) {
      this.gunLocks[i] *= scaleFactor;
    }
    this.shotSpeed *= 1.05;
  };
  
  this.clone = function() {
    var newShot = new Shot(game, group, bulletGroup, yscale, powerScale);
    newShot.gunLocks = this.gunLocks;
    newShot.gunLock = this.gunLock;
    newShot.shotSpeed = this.shotSpeed;
    return newShot;
  };
};

function NewBullet(game, x, y, yscale, angle, speed) {
  var bullet = game.add.sprite(x, y, yscale < 0 ? 'bullet1' : 'bullet');
  bullet.anchor.x = 0.5;
  bullet.anchor.y = 0.5;
  bullet.body.width = 5;
  bullet.body.height = 12;
  bullet.lifespan = 5000;
  bullet.checkWorldBounds = true;
  bullet.outOfBoundsKill = true;
  bullet.angle = angle;
  var rawSpeed = yscale * speed * (1 + (game.time.time - game.time.start) / 100000);
  bullet.body.velocity.x = Math.sin(bullet.rotation) * rawSpeed;
  bullet.body.velocity.y = Math.cos(bullet.rotation) * -1 * rawSpeed;
  return bullet;
}