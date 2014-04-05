function NewShip(game, group, bulletGroup, x, y, yscale) {
  var ship = game.add.sprite(x, y, 'block');
  ship.anchor.x = 0.5;
  ship.anchor.y = 0.5;
  ship.height *= yscale;
  group.add(ship);
  var speedBase = 4;
  ship.moveLeft = function() {
    this.x -= speedBase;
  };
  ship.moveRight = function() {
    this.x += speedBase;
  };
  
  // Firing
  var gunLockMax = 10;
  ship.gunLock = 0;
  ship.update = function() {
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