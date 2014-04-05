function NewShip(game, group, bulletGroup, x, y, yscale) {
  var ship = game.add.sprite(x, y, 'block');
  ship.anchor.x = 0.5;
  ship.anchor.y = 0.5;
  ship.height *= yscale;
  ship.health = 10;
  group.add(ship);
  var speedBase = 4;
  ship.moveLeft = function() {
    if (this.x - this.width / 2 < 0) {
      return;
    }
    this.x -= speedBase;
  };
  ship.moveRight = function() {
    if (this.x + this.width / 2 > game.world.bounds.width) {
      return;
    }
    this.x += speedBase;
  };
  
  // Firing
  var gunLockMax = 10;
  ship.gunLock = 0;
  ship.update = function() {
    if (!this.alive) {
      return;
    }
    this.gunLock--;
    if (this.gunLock <= 0) {
      // auto-fire
      bulletGroup.add(NewBullet(game, this.x, this.y, yscale));
      this.gunLock = gunLockMax;
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