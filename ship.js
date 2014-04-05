function NewShip(game, group, bulletGroup, x, y, yscale, otherShip) {
  group.x = x;
  group.y = y;
  var ship = NewShipPart(game, group, null, bulletGroup, 0, 0, yscale);
  // Add more ship parts
  var i;
  // Track left/right bounds
  group.minDx = 0;
  group.maxDx = 0;
  var childLeft = ship;
  var childRight = ship;
  for (i = 1; i < 3; i++) {
    childLeft = NewShipPart(game, group, childLeft, bulletGroup, -ship.width * i, 0, yscale);
    childRight = NewShipPart(game, group, childRight, bulletGroup, ship.width * i, 0, yscale);
    group.minDx = Math.min(group.minDx, -ship.width * (i + 0.5));
    group.maxDx = Math.max(group.maxDx, ship.width * (i + 0.5));
  }
  
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

function NewShipPart(game, group, parent, bulletGroup, x, y, yscale) {
  var part = game.add.sprite(x, y, 'block');
  part.anchor.x = 0.5;
  part.anchor.y = 0.5;
  part.height *= yscale;
  group.add(part);
  
  // Parent/child
  part.parentPart = parent;
  part.childPart = null;
  if (parent !== null) {
    parent.childPart = part;
  }
  // Recursively add health
  part.addHealth = function(health) {
    this.health += health;
    if (this.parentPart !== null) {
      this.parentPart.addHealth(health);
    }
  };
  part.addHealth(10);
  
  // Firing
  var shot = game.add.audio('shot');
  // Randomly generate a set of gun locks
  var burstSize = Math.floor(Math.random() * 5) + 1;
  var burstLock = Math.floor(Math.random() * 10) + 4;
  var burstEndLock = Math.floor(Math.random() * 30) + 5 + burstLock;
  part.gunLocks = [];
  for (; burstSize > 0; burstSize--) {
    part.gunLocks.push(burstLock);
  }
  part.gunLocks.push(burstEndLock);
  part.gunLock = Math.random() * 50;
  part.gunLockIndex = 0;
  
  // being hit
  var hit = game.add.audio('hit');
  part.hitCount = 0;
  part.takeHit = function() {
    hit.play();
    this.hitCount = 2;
    this.frame = 1;
  };
  
  part.update = function() {
    if (!this.alive) {
      return;
    }
    this.gunLock--;
    if (this.gunLock <= 0) {
      // auto-fire
      shot.play();
      bulletGroup.add(NewBullet(game, this.x + group.x, this.y + group.y, yscale));
      this.gunLock = this.gunLocks[this.gunLockIndex];
      this.gunLockIndex++;
      if (this.gunLockIndex >= this.gunLocks.length) {
        this.gunLockIndex = 0;
      }
    }
    
    if (this.hitCount > 0) {
      this.hitCount--;
      if (this.hitCount === 0) {
        // switch sprite back
        this.frame = 0;
      }
    }
  };
  
  return part;
}

function NewBullet(game, x, y, yscale) {
  var bullet = game.add.sprite(x, y, yscale < 0 ? 'bullet1' : 'bullet');
  bullet.anchor.x = 0.5;
  bullet.anchor.y = 0.5;
  bullet.checkWorldBounds = true;
  bullet.outOfBoundsKill = true;
  bullet.body.velocity.y = yscale * -1 * 800;
  return bullet;
}