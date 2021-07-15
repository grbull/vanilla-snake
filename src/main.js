class Vector {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Food {
  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cellSize
   */
  constructor(context, cellSize) {
    this._context = context;
    this._cellSize = cellSize;

    this.spawn();
  }

  eat() {
    this.isEaten = true;
  }

  spawn() {
    this.position = new Vector(
      Math.ceil(Math.random() * 9),
      Math.ceil(Math.random() * 9)
    );

    this.isEaten = false;
  }

  /**
   * @param {Snake} snake
   */
  update(snake) {
    if (this.isEaten) {
      while (
        snake.cells.find(
          ({ x, y }) => x === this.position.x && y === this.position.y
        )
      ) {
        this.spawn();
      }
    }
  }

  render() {
    this._context.fillStyle = '#FF5964';
    this._context.fillRect(
      this.position.x * this._cellSize,
      this.position.y * this._cellSize,
      this._cellSize,
      this._cellSize
    );
  }
}

class Snake {
  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cellSize
   * @param {Vector} bounds
   */
  constructor(context, cellSize, bounds) {
    this._context = context;
    this._cellSize = cellSize;
    this._bounds = bounds;

    // By default we begin moving right.
    this._speed = new Vector(1, 0);
    // By default the tail length is 0.
    this._tailLength = 0;
    // An array of all the snake cells
    this.cells = [new Vector(0, 0)];

    this.hasCollided = false;
  }

  /**
   * @param {Food} food
   */
  update(food) {
    const headCell = new Vector(
      this.cells[0].x + this._speed.x,
      this.cells[0].y + this._speed.y
    );

    // Make sure head is not moving out of bounds
    if (headCell.x > this._bounds.x) {
      headCell.x = 0;
    }
    if (headCell.x < 0) {
      headCell.x = this._bounds.x;
    }
    if (headCell.y > this._bounds.y) {
      headCell.y = 0;
    }
    if (headCell.y < 0) {
      headCell.y = this._bounds.y;
    }

    // If new head position is on food, increase length.
    if (headCell.x === food.position.x && headCell.y === food.position.y) {
      this._tailLength++;
      food.eat();
    }

    // We traverse the postions in reverse so that if the last piece of the
    // tail does not have a position, it will take on the 2nd to last position
    for (let x = this._tailLength; x >= 1; x--) {
      this.cells[x] = this.cells[x - 1];
    }

    this.cells[0] = headCell;

    // check for collision
    this.hasCollided = !!this.cells
      .slice(1)
      .find(
        (tailCell) => tailCell.x === headCell.x && tailCell.y === headCell.y
      );
  }

  /**
   * Changes the direction the snake is moving by adjusting it's speed.
   * We do not allow the snake to turn 180 degrees.
   *
   * @param {string} direction
   */
  turn(direction) {
    if (direction === 'ArrowLeft' && this._speed.x !== 1) {
      this._speed = new Vector(-1, 0);
    }
    if (direction === 'ArrowRight' && this._speed.x !== -1) {
      this._speed = new Vector(1, 0);
    }
    if (direction === 'ArrowUp' && this._speed.y !== 1) {
      this._speed = new Vector(0, -1);
    }
    if (direction === 'ArrowDown' && this._speed.y !== -1) {
      this._speed = new Vector(0, 1);
    }
  }

  render() {
    for (const cell of this.cells) {
      this._context.fillStyle = '#6BF178';
      this._context.fillRect(
        cell.x * this._cellSize,
        cell.y * this._cellSize,
        this._cellSize,
        this._cellSize
      );
    }
  }
}

class Grid {
  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cellSize
   */
  constructor(context, cellSize) {
    this._context = context;
    this._cellSize = cellSize;

    this._width = this._context.canvas.width;
    this._height = this._context.canvas.height;
  }

  _clear() {
    this._context.fillStyle = 'gray';
    this._context.fillRect(0, 0, this._width, this._height);
  }

  _drawGrid() {
    this._context.beginPath();
    for (let x = 0; x <= this._width; x += this._cellSize) {
      this._context.moveTo(x, 0);
      this._context.lineTo(x, this._height);
    }
    this._context.strokeStyle = 'rgb(170,170,170)';
    this._context.lineWidth = 1;
    this._context.stroke();
    this._context.beginPath();
    for (let y = 0; y <= this._height; y += this._cellSize) {
      this._context.moveTo(0, y);
      this._context.lineTo(this._width, y);
    }
    this._context.strokeStyle = 'rgb(170,170,170)';
    this._context.stroke();
  }

  render() {
    this._clear();
    this._drawGrid();
  }
}

class Game {
  constructor() {
    this._canvas = document.querySelector('#canvas');
    this._context = this._canvas.getContext('2d');
    this._canvas.width = 500;
    this._canvas.height = 500;
    this._cellSize = 25;

    this.setup();
  }

  setup() {
    this._score = 0;

    this._bounds = new Vector(
      this._canvas.width / this._cellSize - 1,
      this._canvas.height / this._cellSize - 1
    );

    this._grid = new Grid(this._context, this._cellSize);
    this._snake = new Snake(this._context, this._cellSize, this._bounds);
    this._food = new Food(this._context, this._cellSize);

    this._registerKeybinds();

    this._nextMove = null;

    this._render();
  }

  start() {
    this._interval = setInterval(() => {
      this._update();
      this._render();
    }, 100);
  }

  restart() {
    this.stop();
    this.setup();
    this.start();
  }

  stop() {
    clearInterval(this._interval);
  }

  _updateScore() {
    this._score++;
    document.querySelector('#score').textContent = this._score;
  }

  _gameOver() {
    document.querySelector('div.game_over').removeAttribute('hidden');
    this.stop();
  }

  _update() {
    // This prevents multiple inputs in one tick
    if (this._nextMove) {
      this._snake.turn(this._nextMove);
      this._nextMove = null;
    }

    this._snake.update(this._food);

    if (this._snake.hasCollided) {
      this._gameOver();
    }

    // snake hasEaten
    if (this._food.isEaten) {
      this._updateScore();
    }

    this._food.update(this._snake);
  }

  _render() {
    this._grid.render();
    this._food.render();
    this._snake.render();
  }

  _registerKeybinds() {
    document.addEventListener('keydown', (e) => (this._nextMove = e.key));
  }
}

let game = new Game();

const startButton = document.querySelector('button.start');
const restartButton = document.querySelector('button.restart');

startButton.addEventListener('click', () => {
  game.start();

  startButton.setAttribute('hidden', true);
  restartButton.removeAttribute('hidden');
});

restartButton.addEventListener('click', () => {
  game.restart();

  document.querySelector('#score').textContent = 0;
  document.querySelector('div.game_over').setAttribute('hidden', true);
});
