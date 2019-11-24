"use strict";

window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

window.addEventListener('load', function(e) {
  let game = new Game();
  game.start();
});

document.getElementById('toggleCRT').addEventListener('click', () => {
  document.body.classList.toggle('crt');
});
