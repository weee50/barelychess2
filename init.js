var c = document.getElementById("board");
var ctx = c.getContext("2d")

c.addEventListener("click", function(event)
    {
        clickX = Math.floor(event.offsetX / 49);
        clickY = Math.floor(event.offsetY / 49);
        click(clickX, clickY);
    }
)