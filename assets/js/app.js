import Phaser from 'phaser'
import GesturesPlugin from 'phaser3-rex-plugins/plugins/gestures-plugin.js';

import ball from './../img/ball.png'
import backgroundSand from './../img/background-sand.jpg'

const config = {
  type: Phaser.AUTO,
  width: window.outerWidth,
  height: window.outerHeight,
  scene: {
    preload: preload,
    create: create
  },
  plugins: {
    scene: [{
        key: 'rexGestures',
        plugin: GesturesPlugin,
        mapping: 'rexGestures'
    }]
}
};

function preload()
{
  this.load.image('ball', ball);
  this.load.image('background-sand', backgroundSand);
}

function create()
{
  this.add.tileSprite(0, 0, window.outerWidth * 2, window.outerHeight * 2, 'background-sand');

  addBall.apply(this);

  const pinch = this.rexGestures.add.pinch();

  var camera = this.cameras.main;
    pinch
        .on('drag1', function (pinch) {
            var drag1Vector = pinch.drag1Vector;
            camera.scrollX -= drag1Vector.x / camera.zoom;
            camera.scrollY -= drag1Vector.y / camera.zoom;
        })
        .on('pinch', function (pinch) {
            var scaleFactor = pinch.scaleFactor;
            camera.zoom *= scaleFactor;
        }, this)
}

function addBall() {
  
  const image = this.add.image(window.outerWidth / 2, window.outerHeight - 300, 'ball').setInteractive({ draggable: true });

  image.on('pointerdown', function() {
    console.log('clicked')
  }, this);
  
  image.on('drag', function (pointer, x, y) {
      image.x = x;
      image.y = y;
  });
}


const game = new Phaser.Game(config);