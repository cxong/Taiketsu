function NewShip(game, group, bulletGroup, x, y, yscale, otherShip) {
  var ship = game.add.sprite(x, y, 'block');
  ship.anchor.x = 0.5;
  ship.anchor.y = 0.5;
  ship.height *= yscale;
  ship.health = 10;
  group.add(ship);
  var speedBase = 4;
  ship.move = function(dir, resetAI) {
    if (resetAI) {
      this.useAI = false;
      this.useAICounter = 100;
    }
    this.x += dir;
    this.x = Math.min(Math.max(this.x, this.width / 2),
                      game.world.bounds.width - this.width / 2);
  };
  ship.moveLeft = function() {
    this.move(-speedBase, true);
  };
  ship.moveRight = function() {
    this.move(speedBase, true);
  };
  
  // Firing
  var gunLocks = [ 5, 5, 15 ];
  ship.gunLock = 0;
  ship.gunLockIndex = 0;
  
  // Use AI
  // If not controlled by player for a while, auto-engage AI
  ship.useAI = true;
  ship.useAICounter = 0;
  ship.aiCounter = 0;
  ship.aiState = 'track'; // track: move to aim at player, left/right: move in direction
  ship.otherShip = null;
  
  ship.update = function() {
    if (!this.alive) {
      return;
    }
    this.gunLock--;
    if (this.gunLock <= 0) {
      // auto-fire
      bulletGroup.add(NewBullet(game, this.x, this.y, yscale));
      this.gunLock = gunLocks[this.gunLockIndex];
      this.gunLockIndex++;
      if (this.gunLockIndex >= gunLocks.length) {
        this.gunLockIndex = 0;
      }
    }
    
    // Use AI
    if (this.useAI) {
      if (this.aiState == 'track') {
        // track the other ship
        if (this.otherShip !== null) {
          var xDiff = this.otherShip.x - this.x;
          xDiff = Math.min(Math.max(xDiff, -speedBase), speedBase);
          this.move(xDiff, false);
        }
      } else if (this.aiState == 'left') {
        this.move(-speedBase, false);
      } else if (this.aiState == 'right') {
        this.move(speedBase, false);
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
  
  return ship;
}

function NewBullet(game, x, y, yscale) {
  var bullet = game.add.sprite(x, y, yscale < 0 ? 'bullet1' : 'bullet');
  bullet.anchor.x = 0.5;
  bullet.anchor.y = 0.5;
  bullet.checkWorldBounds = true;
  bullet.outOfBoundsKill = true;
  bullet.body.velocity.y = yscale * -1 * 600;
  return bullet;
}