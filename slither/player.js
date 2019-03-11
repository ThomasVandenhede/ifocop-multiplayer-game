const randomColor = require("./randomize.js");
const Vector = require("./vector").Vector;

const PLAYER_INITIAL_RADIUS = 20;

class Player {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.type = this.constructor.name;
    this.color = randomColor();

    this.positions = [...Array(50)].map(() => new Vector(x, y));
    this.width = PLAYER_INITIAL_RADIUS;
    this.height = PLAYER_INITIAL_RADIUS;
    this.radius = PLAYER_INITIAL_RADIUS;

    this.speed = 200;
    this.direction = 0;
  }

  update(dt) {
    this.positions.forEach((position, index, self) => {
      const distance = this.speed * dt;

      if (index === 0) {
        // move head
        const dx = distance * Math.cos(this.direction);
        const dy = distance * Math.sin(this.direction);

        self[index].x += dx;
        self[index].y += dy;
      } else {
        // move the rest of the body
        const joint = Vector.subtract(self[index - 1], self[index]);
        const maxJointLength = this.radius * 0.9;

        if (joint.norm > maxJointLength) {
          if (joint.norm <= distance) {
            self[index] = { ...self[index - 1] };
          } else {
            self[index] = Vector.sum(
              self[index],
              Vector.subtract(self[index - 1], self[index])
                .getUnitVector()
                .multiplyByScalar(distance)
            );
          }
        }
      }
    });
  }
}

module.exports.Player = Player;
