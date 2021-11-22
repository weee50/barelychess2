function generateBoard(width, height)
{
  let board = []
  for (let row = 0; row < height; row++)
  {
    board[row] = []
    for (let col = 0; col < width; col++)
    {
      board[row][col] = null
    }
  }
  return board;
}

function drawBoard(board)
{
  ctx.drawImage(imageFromSrc("LeaperWhite.png"), 0, 0)
  ctx.drawImage(imageFromSrc("LeaperBlack.png"), 0, 0)
  ctx.drawImage(imageFromSrc("GarryChess.png"), 0, 0)
  for (x = 0; x < board[0].length; x++)
  {
    for (y = 0; y < board.length; y++)
    {
      ctx.fillStyle = ((x + y) % 2 == 0) ? "#ecdab9" : "#ae8a68"
      ctx.fillRect(x * 49, y * 49, x * 49 + 49, y * 49 + 49)
      if (board[y][x] != null)
      {
        ctx.drawImage(board[y][x].image, x * 49, y * 49)
      }
    }
  }
}

function firstDrawBoard(board)
{
  drawBoard(board)
}

board = generateBoard(16, 16)

function move(x1, y1, x2, y2)
{
  let oldPiece = board[y1][x1];
  board[y1][x1] = null;
  board[y2][x2] = oldPiece;
}

function colorOn(x, y)
{
  if (board[y][x] == null)
  {
    return -1;
  }
  else
  {
    return board[y][x].color;
  }
}

const PIECE_SYMBOLS =
{
  "Rook": "R",
  "Knight": "N",
  "Bishop": "B",
  "Queen": "Q",
  "King": "K",
  "Pawn": "",
  "Blocker": "B",
  "Peasant": "PS",
  "Priest": "PR",
  "Squire": "SQ",
  "Archer": "A",
  "LiterateKnight": "L",
  "Edgedancer": "E",
  "SuperPawn": "SP",
  "Croissant": "C",
  "Jumper": "J",
  "Leaper": "LP",
  "Lancer": "LA",
  "Warlock": "W",
  "Spy": "S"
};

const FEN_STARTING = "ETASDZOQKOZDSATE/PPYWLJCUUCJLWYPP/16/16/16/16/16/16/16/16/16/16/16/16/ppywljcuucjlwypp/etasdzoqkozdsate"

function parseFen(fenString)
{
  let xLoc = 0;
  let yLoc = 0;

  for (i = 0; i < fenString.length; i++)
  {
    char = fenString[i];
    if ("0123456789/".indexOf(char) == -1)
    {
      board[yLoc][xLoc] = fenArray[char](xLoc, yLoc);
      xLoc++;
    }
    else if ("0123456789".indexOf(char) != -1)
    {
      xLoc += Number(char);
    }
    else if (char == "/")
    {
      xLoc = 0;
      yLoc += 1;
    }
  }
}

// returns all en passant (or en croissant) targets on a line from (startX, startY) to (endX, endY).
// does not include the points (startX, startY) and (endX, endY) themselves.
function passantTargets(startX, startY, endX, endY)
{
  deltaX = Math.abs(endX - startX)
  deltaY = Math.abs(endY - startY)

  let moveGcd = gcd(deltaX, deltaY)

  let xStep = deltaX / moveGcd * Math.sign(endX - startX);
  let yStep = deltaY / moveGcd * Math.sign(endY - startY);

  targets = [];
  checkX = startX + xStep;
  checkY = startY + yStep;

  while (!(checkX == endX && checkY == endY))
  {
    targets.push([checkX, checkY])
    checkX += xStep
    checkY += yStep
  }

  return targets;
}

function gcd(a, b)
{
  if (b > a)
  {
    let temp = b;
    b = a;
    a = temp;
  }

  while (b != 0)
  {
    let temp = b;
    b = a % b;
    a = temp;
  }

  return a
}

parseFen(FEN_STARTING);
castlingAvailability = [[true, true], [true, true]]
// [[white queenside, white kingside], [black queenside, black kingside]]

enPassantTargets = null;
enPassantPiece = null;
enPassantCounter = 0;

gameNotation = "";
turnNumber = 1;

whoseTurn = 0;
specialTurnType = "";

collectivistGovernment = [false, false]; // [white, black]

x = setTimeout(x => firstDrawBoard(board), 100);
selectedPiece = null;

legalMarkerImage = new Image()
legalMarkerImage.src = "LegalMarker.png"

function click(clickX, clickY)
{
  if (selectedPiece == null && board[clickY][clickX] != null)
  {
    if (board[clickY][clickX].color != whoseTurn)
    {
      return;
    }
    else if (specialTurnType == "jumper" && board[clickY][clickX].name != "Jumper")
    {
      return;
    }
    else if (specialTurnType == "warlock" && PAWN_LIKE_PIECES.includes(board[clickY][clickX].name) && board[clickY][clickX].name != "Warlock")
    {
      return;
    }

    let legalMoves = board[clickY][clickX].legalMoves();
    if (legalMoves.length == 0)
    {
      return;
    }
    selectedPiece = board[clickY][clickX]
    for (m of legalMoves)
    {
      ctx.drawImage(legalMarkerImage, m[0] * 49, m[1] * 49)
    }
  }
  else
  {
    if (selectedPiece.canMoveToLegal(clickX, clickY))
    {
      specialTurnType = "";

      let special = selectedPiece.specialModifier(clickX, clickY)
      let oldX = selectedPiece.x;
      let oldY = selectedPiece.y;

      if (board[clickY][clickX] != null && board[clickY][clickX].name == "Edgedancer")
      {
        if (clickX == 0 && castlingAvailability[1 - selectedPiece.color][0])
        {
          castlingAvailability[1 - selectedPiece.color][0] = false;
        }
        else if (clickX == 15 && castlingAvailability[1 - selectedPiece.color][1])
        {
          castlingAvailability[1 - selectedPiece.color][1] = false;
        }
      }

      if (special == 100)
      {
        gameNotation += (selectedPiece.algebraicNotation(selectedPiece.x, selectedPiece.y, clickX, clickY) + " ")
        whoseTurn = (1 - whoseTurn);
        selectedPiece.moveTo(selectedPiece.x, selectedPiece.y, clickX, clickY)
      }
      else if (selectedPiece.isPassantMove(clickX, clickY))
      {
        gameNotation += (selectedPiece.algebraicNotation(clickX, clickY, enPassantPiece.x, enPassantPiece.y) + " ")
        whoseTurn = (1 - whoseTurn);
        selectedPiece.moveTo(clickX, clickY, enPassantPiece.x, enPassantPiece.y)
        enPassantCounter += 1;
      }
      else if (special == 150)
      {
        specialTurnType = "jumper"
        gameNotation += (selectedPiece.algebraicNotation(clickX, clickY, selectedPiece.auxArgument(clickX, clickY, 3), selectedPiece.auxArgument(clickX, clickY, 4)))
        selectedPiece.moveTo(clickX, clickY, selectedPiece.auxArgument(clickX, clickY, 3), selectedPiece.auxArgument(clickX, clickY, 4))
        if (selectedPiece.legalMoves().length == 0)
        {
          specialTurnType = "";
          whoseTurn = 1 - whoseTurn;
        }
      }
      else
      {
        if (isOccupied([clickX, clickY]) && board[clickY][clickX].name == "King")
        {
          collectivistGovernment[board[clickY][clickX].color] = true;
        }
        if (special == 250)
        {
          specialTurnType = "warlock"
          gameNotation += (selectedPiece.algebraicNotation(clickX, clickY) + ",")
        }
        else
        {
          whoseTurn = (1 - whoseTurn);
          gameNotation += (selectedPiece.algebraicNotation(clickX, clickY) + " ")
        }
        selectedPiece.moveTo(clickX, clickY)
      }

      if (special == 200)
      {
        selectedPiece.internalCounter++;
        if (selectedPiece.name == "Priest" && selectedPiece.internalCounter == 4)
        {
          selectedPiece.remove();
        }
      }

      if (!LEAPERS.includes(selectedPiece.name))
      {
        enPassantTargets = passantTargets(oldX, oldY, clickX, clickY);
        enPassantPiece = selectedPiece;
      }

      if (selectedPiece.name == "King")
      {
        castlingAvailability[selectedPiece.color] = [false, false]
      }
      else if (selectedPiece.name == "Rook")
      {
        if (selectedPiece.y == 0 && castlingAvailability[selectedPiece.color][0])
        {
          castlingAvailability[selectedPiece.color][0] = false;
        }
        else if (selectedPiece.x == 7 && castlingAvailability[selectedPiece.color][1])
        {
          castlingAvailability[selectedPiece.color][1] = false;
        }
      }

      if (selectedPiece.name == "Spy")
      {
        selectedPiece.image = imageFromSrc((selectedPiece.color == 0 ? "PawnWhite.png" : "PawnBlack.png"))
      }

      if (special > 0)
      {
        if (selectedPiece.name == "King")
        {
          if (special == 1)
          {
            board[clickY][0].moveTo(5, clickY)
          }
          else if (special == 2)
          {
            board[clickY][15].moveTo(11, clickY)
          }
        }
      }

      if (PAWN_LIKE_PIECES.includes(selectedPiece.name) && (selectedPiece.y == 0 || selectedPiece.y == 15))
      {
        if (selectedPiece.name == "Jumper")
        {
          selectedPiece.replaceWith("Leaper");
        }
        else
        {
          promotedPiece = null;
          pickedValidPiece = false;
          isFirstAttempt = true;
          while (!pickedValidPiece)
          {
            promotedPiece = prompt(isFirstAttempt ? "Enter the piece you'd like to promote to. Use full names, like \"Queen\" or \"Literate Knight\". If your piece comes out invisible, just blame the fact that it's 11:30 PM right now and I don't have time to fix bugs like that. It'll reappear once the opponent makes a move." : "That is not a valid piece. (use full names, like \"Queen\" or \"Literate Knight\")", "Queen");
            if (PROMOTABLE_PIECES.includes(promotedPiece))
            {
              pickedValidPiece = true;
            }
            else if (collectivistGovernment[selectedPiece.color] && promotedPiece == "King")
            {
              if (selectedPiece.beingAttacked())
              {
                alert("No way, that would start the king in check!");
              }
              else
              {
                pickedValidPiece = true;
              }
            }

            isFirstAttempt = false;
          }
          selectedPiece.replaceWith(promotedPiece);
          if (promotedPiece == "King")
          {
            collectivistGovernment[selectedPiece.color] = false;
          }
        }
      }
    }

    drawBoard(board);
    document.getElementById("notation").innerText = gameNotation;
    selectedPiece = null;
  }

  if (enPassantCounter >= 12)
  {
    ctx.drawImage(imageFromSrc("GarryChess.png"), 0, 0);
    gameNotation += " 0-0-1 (Garry Chess wins)";
    document.getElementById("notation").innerText = gameNotation;
  }
}