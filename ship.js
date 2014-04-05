function NewShip(game, group, x, y) {
  var ship = game.add.sprite(x, y, 'block');
  group.add(ship);
  var speedBase = 7;
  ship.moveLeft = function() {
    this.x -= speedBase;
  };
  ship.moveRight = function() {
    this.x += speedBase;
  };
  return ship;
}