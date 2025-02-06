document.addEventListener("DOMContentLoaded", () => {
  const board = document.getElementById("board");
  const circle = document.createElement("div");
  circle.classList.add("circle");
  board.appendChild(circle);

  let posX = 50,
    posY = 50;
  let velocityX = 2,
    velocityY = 3;

  function moveCircle() {
    posX += velocityX;
    posY += velocityY;

    if (posX <= 0 || posX + circle.clientWidth >= board.clientWidth) {
      velocityX = -velocityX;
    }
    if (posY <= 0 || posY + circle.clientHeight >= board.clientHeight) {
      velocityY = -velocityY;
    }

    circle.style.left = posX + "px";
    circle.style.top = posY + "px";

    requestAnimationFrame(moveCircle);
  }

  moveCircle();
});
