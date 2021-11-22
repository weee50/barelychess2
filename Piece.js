class Piece
{
  constructor(x, y, name, color, image, valid)
  {
    this.name = name;
    this.color = color;
    this.image = imageFromSrc(image);
    this.valid = valid;
    this.x = x;
    this.y = y;
    this.internalCounter = 0;
  }

  remove()
  {
    board[this.y][this.x] = null;
  }

  // replaces this piece with a different piece of the same color
  replaceWith(pieceName)
  {
    board[this.y][this.x] = genPiece(pieceName, this.color)(this.x, this.y);
  }

  canMoveTo(x, y)
  {
    for (let m of this.validMoves())
    {
      if (m[0] == x && m[1] == y)
      {
        return true;
      }
    }
    return false;
  }

  canMoveToSemiLegal(x, y)
  {
    for (let m of this.semiLegalMoves())
    {
      if (m[0] == x && m[1] == y)
      {
        return true;
      }
    }
    return false;
  }

  canMoveToLegal(x, y)
  {
    for (let m of this.legalMoves())
    {
      if (m[0] == x && m[1] == y)
      {
        return true;
      }
    }
    return false;
  }

  specialModifier(x, y) // what special modifier, if any, applies to the move to (x,y)
  {
    for (let m of this.validMoves())
    {
      if (m[0] == x && m[1] == y)
      {
        if (m.length > 2)
        {
          return m[2];
        }
        else
        {
          return 0;
        }
      }
    }
    return -1;
  }

  auxArgument(x, y, arg) // get an auxiliary argument for a move if one exists
  {
    for (let m of this.validMoves())
    {
      if (m[0] == x && m[1] == y)
      {
        if (m.length > arg)
        {
          return m[arg];
        }
        else
        {
          return null;
        }
      }
    }
    return null;
  }

  validMoves() // moves that are valid if check didn't exist
  {
    return this.valid(this.x, this.y, this.color)
  }

  semiLegalMoves() // moves that are legal, including check, but not including warlocks' forced en passant
  {
    let valid = this.validMoves();

    let legalMvs = []
    for (let m of valid)
    {
      let capX = null;
      let capY = null;
      let moveX = m[0];
      let moveY = m[1];
      if (this.specialModifier(moveX, moveY) == 100)
      {
        capX = m[0];
        capY = m[1];
        moveX = this.x;
        moveY = this.y;
      }
      else if (this.isPassantMove(moveX, moveY))
      {
        capX = enPassantPiece.x;
        capY = enPassantPiece.y;
      }
      else if (this.specialModifier(moveX, moveY) == 150)
      {
        capX = m[3];
        capY = m[4];
      }

      if (!this.resultsInCheck(moveX, moveY, capX, capY))
      {
        if (this.name == "King" && this.specialModifier(moveX, moveY) != 0 && !this.canCastleTo(moveX, moveY))
        {
          console.log(m);
        }
        else
        {
          legalMvs.push(m);
        }
      }
    }

    return legalMvs;
  }

  legalMoves()
  {
    let semiLegal = this.semiLegalMoves();
    let warlockEnPassant = false;

    for (let row of board)
    {
      for (let piece of row)
      {
        if (piece != null && piece.name == "Warlock" && piece.passantAvailable())
        {
          warlockEnPassant = true;
          console.log("Warlock en passant!")
        }
      }
    }

    if (!warlockEnPassant)
    {
      return semiLegal;
    }
    else if (this.name != "Warlock")
    {
      return [];
    }
    else
    {
      let legal = []

      for (m of semiLegal)
      {
        if (this.isPassantMove(m[0], m[1]))
        {
          legal.push(m);
        }
      }

      return legal;
    }
  }

  beingAttacked() // is this piece being attacked? (for a king, is it in check?)
  {
    for (let row of board)
    {
      for (let piece of row)
      {
        if (piece != null && piece.color != this.color)
        {
          if (piece.canMoveTo(this.x, this.y))
          {
            return true;
          }
        }
      }
    }
    return false;
  }

  beingProtected() // is this piece being protected? (used for priests)
  {
    board[this.y][this.x] = null; // because you can't normally capture a friendly piece

    for (let row of board)
    {
      for (let piece of row)
      {
        if (piece != null && piece.color == this.color)
        {
          if (piece.canMoveTo(this.x, this.y))
          {
            board[this.y][this.x] = this;
            return true;
          }
        }
      }
    }
    board[this.y][this.x] = this;
    return false;
  }

  resultsInCheck(x, y, captureX=null, captureY=null, opposite=false) // does moving this piece to these coords result in check?
  // opposite == true, check for checks to the opposing player, opposite = false, checks for checks to yourself
  {
    let movementCapturedPiece = board[y][x]
    let longRangeCapturedPiece = (captureX == null ? null : board[captureY][captureX]);
    if (movementCapturedPiece != null && movementCapturedPiece.name == "King" && movementCapturedPiece.color != this.color)
    {
      return true;
    }
    if (longRangeCapturedPiece != null && longRangeCapturedPiece.name == "King" && movementCapturedPiece.color != this.color)
    {
      return true;
    }

    let oldX = this.x
    let oldY = this.y

    let kingX = -1;
    let kingY = -1;

    this.moveTo(x, y, captureX, captureY)
    
    for (let row of board)
    {
      for (let piece of row)
      {
        if (piece != null && ((!opposite && piece.color == this.color) || (opposite && piece.color != this.color)) && piece.name == "King")
        {
          kingX = piece.x;
          kingY = piece.y;
        }
      }
    }

    if (kingX == -1)
    {
      this.moveTo(oldX, oldY)
      board[y][x] = movementCapturedPiece;
      if (captureX != null)
      {
        board[captureY][captureX] = longRangeCapturedPiece;
      }
  
      return false;
    }

    for (let row of board)
    {
      for (let piece of row)
      {
        if (piece != null && (!opposite && piece.color != this.color || opposite && piece.color == this.color))
        {
          if (piece.canMoveTo(kingX, kingY))
          {
            this.moveTo(oldX, oldY)
            board[y][x] = movementCapturedPiece;
            if (captureX != null)
            {
              board[captureY][captureX] = longRangeCapturedPiece;
            }
            return true;
          }
        }
      }
    }

    this.moveTo(oldX, oldY)
    board[y][x] = movementCapturedPiece;
    if (captureX != null)
    {
      board[captureY][captureX] = longRangeCapturedPiece;
    }

    return false;
  }

  // Returns whether there is a valid "castling path" from xNew to yNew. The conditions for a valid castling path are:
  // * The final square must be empty
  // * None of the squares along the path are occupied or being attacked
  canCastleTo(xNew, yNew)
  {
    let deltaX = Math.abs(xNew - this.x);
    let deltaY = Math.abs(yNew - this.y);

    if (deltaX == 0 && deltaY == 0)
    {
      return false; // failsafe
    }

    let moveGcd = gcd(deltaX, deltaY);

    let xStep = deltaX / moveGcd * Math.sign(xNew - this.x);
    let yStep = deltaY / moveGcd * Math.sign(xNew - this.y);

    let targets = [];
    let checkX = this.x;
    let checkY = this.y;

    let seenStartSquare = false;

    while (checkX >= 0 && checkX < board[0].length && checkY >= 0 && checkY < board.length)
    {
      if (isOccupied([checkX, checkY]) && !(checkX == this.x && checkY == this.y))
      {
        if (board[checkY][checkX].name == "Edgedancer" && board[checkY][checkX].color == this.color)
        {
          return seenStartSquare;
        }
        else
        {
          return false;
        }
      }
      if (!seenStartSquare && this.resultsInCheck(checkX, checkY))
      {
        return false;
      }
      if (checkX == xNew && checkY == yNew)
      {
        seenStartSquare = true;
      }

      checkX += xStep
      checkY += yStep
    }

    return false;
  }

  // returns whether the move from xNew to yNew is an en passant move
  isPassantMove(xNew, yNew)
  {
    if (enPassantTargets == null)
    {
      return false;
    }
    if (!enPassantPiece.isCapturableBy(this.color))
    {
      return false;
    }
    if (!(PASSANTING_PIECES.includes(this.name)))
    {
      return false;
    }
    else if (!(CROISSANTING_PIECES.includes(this.name)) && !(PAWN_LIKE_PIECES.includes(enPassantPiece.name)))
    {
      return false;
    }
    else
    {
      return (includesArray(enPassantTargets, [xNew, yNew]))
    }
  }

  isCapturableBy(color, piece_name="null")
  {
    if (color == this.color)
    {
      return piece_name == "Peasant" && this.name == "King";
    }
    else if (this.name == "Blocker")
    {
      return false;
    }
    else if (this.name == "Priest" && this.beingProtected())
    {
      return false;
    }
    else
    {
      return true;
    }
  }

  moveTo(xNew, yNew, captureX=null, captureY=null)
  {
    board[this.y][this.x] = null;
    this.x = xNew;
    this.y = yNew;
    board[yNew][xNew] = this;

    if (captureX != null)
    {
      board[captureY][captureX] = null;
    }
  }

  passantAvailable() // is en passant available for this piece?
  {
    if (enPassantTargets == null)
    {
      return false;
    }

    for (let t of enPassantTargets)
    {
      if (this.canMoveToSemiLegal(t[0], t[1]) && this.isPassantMove(t[0], t[1]))
      {
        return true;
      }
    }
    return false;
  }

  algebraicNotation(x, y, capX, capY) // algebraic notation for this piece moving to (x, y)
  {
    let notation = PIECE_SYMBOLS[this.name]
    let special = this.specialModifier(x, y)
    let shootCapture = false;

    if (x == this.x && y == this.y)
    {
      x = capX
      y = capY
      shootCapture = true
    }

    if (this.name == "King" && special == 1)
    {
      notation = "O-O-O";
    }
    else if (this.name == "King" && special == 2)
    {
      notation = "O-O";
    }
    else
    {
      if (this.name != "Pawn")
      {
        let fileDisambig = false;
        let rankDisambig = false;

        for (let row of board)
        {
          for (let piece of row)
          {
            if (piece != null && piece != this && piece.name == this.name && piece.color == this.color && piece.canMoveToLegal(x, y))
            {
              if (piece.x == this.x)
              {
                rankDisambig = true;
              }
              else
              {
                fileDisambig = true;
              }
            }
          }
        }

        if (fileDisambig)
        {
          notation += "abcdefghijklmnop"[this.x];
        }
        if (rankDisambig)
        {
          notation += (16 - this.y);
        }
      }

      if (board[y][x] != null)
      {
        if (this.name == "Pawn")
        {
          notation += "abcdefghijklmnop"[this.x] + "x";
        }
        else if (shootCapture)
        {
          notation += "^";
        }
        else
        {
          notation += "x";
        }
      }

      notation += "abcdefghijklmnop"[x] + (16 - y);
    }

    if (this.resultsInCheck(x, y, capX, capY, true))
    {
      if (this.isMate(x, y))
      {
        notation += "#";
      }
      else
      {
        notation += "+";
      }
    }
    else
    {
      if (this.isMate(x, y))
      {
        notation += " 1/2-1/2"
      }
    }

    if (this.color == 0)
    {
      notation = turnNumber + ". " + notation;
      turnNumber += 1;
    }

    return notation;
  }

  isMate(x, y) // does moving this piece to this square cause mate (checkmate or stalemate)?
  {
    let capturedPiece = board[y][x];
    let oldX = this.x
    let oldY = this.y
    this.moveTo(x, y)

    for (let row of board)
    {
      for (let piece of row)
      {
        if (piece != null && piece.color != this.color)
        {
          if (piece.legalMoves().length != 0)
          {
            this.moveTo(oldX, oldY)
            board[y][x] = capturedPiece;
            return false;
          }
        }
      }
    }

    this.moveTo(oldX, oldY)
    board[y][x] = capturedPiece;
    return true;
  }
}

function imageFromSrc(theSrc)
{
    x = new Image();
    x.src = theSrc;
    return x;
}

function isEmpty(arr)
{
  return board[arr[1]][arr[0]] == null;
}

function isOccupied(arr)
{
  return board[arr[1]][arr[0]] != null;
}

function genPusherMoves(dir1, dir2, limit=-1, absolute=false, piece_name="null")
{
  return function(startX, startY, color) {
    let factors = (absolute ? [[1, (color == 0 ? 1 : -1)]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]])

    let actualDirs = []
    for (k of factors)
    {
      let newDir1 = [dir1 * k[0], dir2 * k[1]]
      let newDir2 = [dir2 * k[0], dir1 * k[1]]
      if (!includesArray(actualDirs, newDir1))
      {
        actualDirs.push(newDir1);
      }
      if (!absolute && !includesArray(actualDirs, newDir2))
      {
        actualDirs.push(newDir2);
      }
    }

    let legalMoves = [];

    for (d of actualDirs)
    {
      let lineEnded = false;
      let checkX = startX;
      let checkY = startY;
      let moveCount = 0;
      while (!lineEnded)
      {
        checkX += d[0];
        checkY += d[1];
        if (checkX >= 0 && checkY >= 0 && checkX < board[0].length && checkY < board.length)
        {
          if (board[checkY][checkX] != null)
          {
            lineEnded = true;
            if (board[checkY][checkX].isCapturableBy(color, piece_name))
            {
              if (!includesArray(legalMoves, [checkX, checkY]))
              {
                legalMoves.push([checkX, checkY]);
              }
            }
          }
          else
          {
            if (!includesArray(legalMoves, [checkX, checkY]))
            {
              legalMoves.push([checkX, checkY]);
            }
          }
        }
        else
        {
          lineEnded = true;
        }

        moveCount++;
        if (moveCount == limit)
        {
          lineEnded = true;
        }
      }
    }

    return legalMoves;
  }
}



function genLeaperMoves(dir1, dir2, piece_name="null")
{
  return function(startX, startY, color) {
    let factors = [[1, 1], [1, -1], [-1, 1], [-1, -1]]

    let actualDirs = []
    for (k of factors)
    {
      let newDir1 = [dir1 * k[0], dir2 * k[1]]
      let newDir2 = [dir2 * k[0], dir1 * k[1]]
      if (!includesArray(actualDirs, newDir1))
      {
        actualDirs.push(newDir1);
      }
      if (!includesArray(actualDirs, newDir2))
      {
        actualDirs.push(newDir2);
      }
    }

    let legalMoves = [];

    for (d of actualDirs)
    {
      let checkX = startX + d[0];
      let checkY = startY + d[1];
      if (checkX >= 0 && checkY >= 0 && checkX < board[0].length && checkY < board.length)
      {
        if (board[checkY][checkX] != null)
        {
          if (board[checkY][checkX].isCapturableBy(color, piece_name))
          {
            if (!includesArray(legalMoves, [checkX, checkY]))
            {
              legalMoves.push([checkX, checkY]);
            }
          }
        }
        else
        {
          if (!includesArray(legalMoves, [checkX, checkY]))
          {
            legalMoves.push([checkX, checkY]);
          }
        }
      }
    }

    return legalMoves;
  }
}

function pawnMoves(startX, startY, color)
{
  let legalMoves = []
  let capturingDirs = []

  let colorDirs = [-1, 1]

  let isFirstMove = (startY == 1 || startY == board.length - 2)

  capturingDirs.push([-1, colorDirs[color]])
  capturingDirs.push([1, colorDirs[color]])

  legalMoves.push(...genPusherMoves(0, -1, (isFirstMove ? 4 : 2), true)(startX, startY, color).filter(isEmpty))

  for (d of capturingDirs)
  {
    let checkX = startX + d[0];
    let checkY = startY + d[1];
    if (checkX >= 0 && checkY >= 0 && checkX < board[0].length && checkY < board.length)
    {
      if ((board[checkY][checkX] != null && board[checkY][checkX].isCapturableBy(color))
          || (enPassantTargets != null && includesArray(enPassantTargets, [checkX, checkY]) && passantCheck(checkX, checkY, color)))
      {
        if (!includesArray(legalMoves, [checkX, checkY]))
        {
          legalMoves.push([checkX, checkY]);
        }
      }
    }
  }

  return legalMoves;
}

function passantCheck(x, y, color, power=false) // true for en croissant, false for en passant
{
  if (enPassantTargets == null)
  {
    return false;
  }
  if (!enPassantPiece.isCapturableBy(color))
  {
    return false;
  }
  if (!power && !(PAWN_LIKE_PIECES.includes(enPassantPiece.name)))
  {
    return false;
  }
  else
  {
    return (includesArray(enPassantTargets, [x, y]))
  }
}

function croissantMoves(startX, startY, color)
{
  let legalMoves = []
  let capturingDirs = []

  let colorDirs = [-1, 1]

  let isFirstMove = (startY == 1 || startY == board.length - 2)

  capturingDirs.push([-1, colorDirs[color]])
  capturingDirs.push([1, colorDirs[color]])

  legalMoves.push(...genPusherMoves(0, -1, (isFirstMove ? 4 : 2), true)(startX, startY, color).filter(isEmpty))

  for (d of capturingDirs)
  {
    let checkX = startX + d[0];
    let checkY = startY + d[1];
    if (checkX >= 0 && checkY >= 0 && checkX < board[0].length && checkY < board.length)
    {
      if (enPassantTargets != null && includesArray(enPassantTargets, [checkX, checkY]) && passantCheck(checkX, checkY, color, true))
      {
        if (!includesArray(legalMoves, [checkX, checkY]))
        {
          legalMoves.push([checkX, checkY]);
        }
      }
    }
  }

  return legalMoves;
}

function kingMoves(startX, startY, color)
{
  legalMoves = combine(genLeaperMoves(1, 0), genLeaperMoves(1, 1))(startX, startY, color);
  if (castlingAvailability[color][0] && board[startY][startX - 1] == null && board[startY][startX - 2] == null && board[startY][startX - 3] == null)
  {
    legalMoves.push([startX - 4, startY, 1]);
  }
  if (castlingAvailability[color][1] && board[startY][startX + 1] == null && board[startY][startX + 2] == null)
  {
    legalMoves.push([startX + 4, startY, 2]);
  }

  return legalMoves;
}

function combine(set1, set2)
{
  return (startX, startY, color) => (set1(startX, startY, color).concat(set2(startX, startY, color)))
}

function includesArray(bigArray, smallArray)
{
  for (x of bigArray)
  {
    if (x.length == smallArray.length)
    {
      let isMatch = true;
      for (i = 0; i < smallArray.length; i++)
      {
        if (smallArray[i] != x[i])
        {
          isMatch = false;
        }
      }

      if (isMatch)
      {
        return true;
      }
    }
  }

  return false;
}

function edgedancerMoves(startX, startY, color)
{
  legalMoves = combine(genLeaperMoves(1, 0), genLeaperMoves(1, 1))(startX, startY, color);
  edgeMoves = genPusherMoves(1, 0)(startX, startY, color).filter(x => x[0] == 0 || x[0] == 15 || x[1] == 0 || x[1] == 15);

  return legalMoves.concat(edgeMoves);
}

function blockerMoves(startX, startY, color)
{
  let legalMoves = combine(genLeaperMoves(1, 0), genLeaperMoves(1, 1))(startX, startY, color);
  legalMoves = legalMoves.filter(isEmpty);
  return legalMoves;
}

function archerMoves(startX, startY, color)
{
  let movementMoves = combine(genPusherMoves(1, 0, 4), genPusherMoves(1, 1, 4))(startX, startY, color).filter(isEmpty);
  let capturingMoves = genPusherMoves(0, -1, 4, true)(startX, startY, color).filter(isOccupied).map(x => x.concat(100))
  let legalMoves = movementMoves.concat(capturingMoves)

  return legalMoves;
}

function jumperMoves(startX, startY, color)
{
  let movementMoves = combine(genPusherMoves(1, -1, 1, true), genPusherMoves(-1, -1, 1, true))(startX, startY, color).filter(isEmpty);
  let capturingMoves = combine(genPusherMoves(2, -2, 1, true), genPusherMoves(-2, -2, 1, true))(startX, startY, color)
  let actualCapturingMoves = []

  for (m of capturingMoves)
  {
    let midX = (m[0] + startX) / 2;
    let midY = (m[1] + startY) / 2;
    if (isOccupied([midX, midY]) && !isOccupied(m))
    {
      actualCapturingMoves.push([m[0], m[1], 150, midX, midY])
    }
  }

  if (specialTurnType == "jumper")
  {
    movementMoves = []
  }

  return movementMoves.concat(actualCapturingMoves);
}

function leaperMoves(startX, startY, color)
{
  let movementMoves = genLeaperMoves(1, 1)(startX, startY, color).filter(isEmpty);
  let capturingMoves = genLeaperMoves(2, 2)(startX, startY, color)
  let actualCapturingMoves = []

  for (m of capturingMoves)
  {
    let midX = (m[0] + startX) / 2;
    let midY = (m[1] + startY) / 2;
    if (isOccupied([midX, midY]) && !isOccupied(m))
    {
      actualCapturingMoves.push([m[0], m[1], 150, midX, midY])
    }
  }

  return movementMoves.concat(actualCapturingMoves);
}

function priestMoves(startX, startY, color)
{
  let movementMoves = genPusherMoves(1, 1)(startX, startY, color).filter(x => isEmpty(x));
  let capturingMoves = genPusherMoves(1, 1)(startX, startY, color).filter(x => isOccupied(x) && PAWN_LIKE_PIECES.includes(board[x[1]][x[0]].name)).map(x => x.concat(200));

  return movementMoves.concat(capturingMoves)
}

function warlockMoves(startX, startY, color)
{
  let legalMoves = []
  let capturingDirs = []

  let colorDirs = [-1, 1]

  capturingDirs.push([-1, colorDirs[color]])
  capturingDirs.push([1, colorDirs[color]])

  legalMoves.push(...genPusherMoves(0, -1, 4, true)(startX, startY, color).filter(isEmpty))

  for (d of capturingDirs)
  {
    let checkX = startX + d[0];
    let checkY = startY + d[1];
    if (checkX >= 0 && checkY >= 0 && checkX < board[0].length && checkY < board.length)
    {
      if ((board[checkY][checkX] != null && board[checkY][checkX].isCapturableBy(color))
          || (enPassantTargets != null && includesArray(enPassantTargets, [checkX, checkY]) && passantCheck(checkX, checkY, color)))
      {
        if (!includesArray(legalMoves, [checkX, checkY, 250]))
        {
          legalMoves.push([checkX, checkY, 250]);
        }
      }
    }
  }

  return legalMoves;
}

function queenMoves(startX, startY, color)
{
  if (collectivistGovernment[color])
  {
    return combine(genLeaperMoves(1, 0), genLeaperMoves(1, 1))(startX, startY, color);
  }
  else
  {
    return combine(genPusherMoves(1, 0), genPusherMoves(1, 1))(startX, startY, color);
  }
}

function peasantMoves(startX, startY, color)
{
  if (collectivistGovernment[color])
  {
    return combine(combine(genPusherMoves(1, 1, 2, false, "Peasant"), genPusherMoves(1, 0, 2, true, "Peasant")), genPusherMoves(-1, 0, 2, true, "Peasant"))(startX, startY, color);
  }
  else
  {
    return combine(combine(genLeaperMoves(1, 1, "Peasant"), genPusherMoves(1, 0, 1, true, "Peasant")), genPusherMoves(-1, 0, 1, true, "Peasant"))(startX, startY, color);
  }
}

function genPiece(name, color)
{
  return ((x, y) => new Piece(x, y, name, color, name + COLOR_NAMES[color] + ".png", MOVESETS[name]))
}

WHITE_ROOK = genPiece("Rook", 0)
WHITE_KNIGHT = genPiece("Knight", 0)
WHITE_BISHOP = genPiece("Bishop", 0)
WHITE_QUEEN = genPiece("Queen", 0)
WHITE_KING = genPiece("King", 0)
WHITE_PAWN = genPiece("Pawn", 0)
WHITE_EDGEDANCER = genPiece("Edgedancer", 0)
WHITE_SQUIRE = genPiece("Squire", 0)
WHITE_LITERATE_KNIGHT = genPiece("LiterateKnight", 0)
WHITE_LANCER = genPiece("Lancer", 0)
WHITE_BLOCKER = genPiece("Blocker", 0)
WHITE_ARCHER = genPiece("Archer", 0)
WHITE_CROISSANT = genPiece("Croissant", 0)
WHITE_SUPER_PAWN = genPiece("SuperPawn", 0)
WHITE_SPY = genPiece("Spy", 0)
WHITE_JUMPER = genPiece("Jumper", 0)
WHITE_LEAPER = genPiece("Leaper", 0)
WHITE_PRIEST = genPiece("Priest", 0)
WHITE_WARLOCK = genPiece("Warlock", 0)
WHITE_PEASANT = genPiece("Peasant", 0)

BLACK_ROOK = genPiece("Rook", 1)
BLACK_KNIGHT = genPiece("Knight", 1)
BLACK_BISHOP = genPiece("Bishop", 1)
BLACK_QUEEN = genPiece("Queen", 1)
BLACK_KING = genPiece("King", 1)
BLACK_PAWN = genPiece("Pawn", 1)
BLACK_EDGEDANCER = genPiece("Edgedancer", 1)
BLACK_SQUIRE = genPiece("Squire", 1)
BLACK_LITERATE_KNIGHT = genPiece("LiterateKnight", 1)
BLACK_LANCER = genPiece("Lancer", 1)
BLACK_BLOCKER = genPiece("Blocker", 1)
BLACK_ARCHER = genPiece("Archer", 1)
BLACK_CROISSANT = genPiece("Croissant", 1)
BLACK_SUPER_PAWN = genPiece("SuperPawn", 1)
BLACK_SPY = genPiece("Spy", 1)
BLACK_JUMPER = genPiece("Jumper", 1)
BLACK_LEAPER = genPiece("Leaper", 1)
BLACK_PRIEST = genPiece("Priest", 1)
BLACK_WARLOCK = genPiece("Warlock", 1)
BLACK_PEASANT = genPiece("Peasant", 1)

fenArray = {
  "R": BLACK_ROOK,
  "N": BLACK_KNIGHT,
  "B": BLACK_BISHOP,
  "Q": BLACK_QUEEN,
  "K": BLACK_KING,
  "P": BLACK_PAWN,
  "E": BLACK_EDGEDANCER,
  "S": BLACK_SQUIRE,
  "T": BLACK_LITERATE_KNIGHT,
  "L": BLACK_LANCER,
  "O": BLACK_BLOCKER,
  "A": BLACK_ARCHER,
  "C": BLACK_CROISSANT,
  "U": BLACK_SUPER_PAWN,
  "Y": BLACK_SPY,
  "J": BLACK_JUMPER,
  "I": BLACK_LEAPER,
  "D": BLACK_PRIEST,
  "W": BLACK_WARLOCK,
  "Z": BLACK_PEASANT,

  "r": WHITE_ROOK,
  "n": WHITE_KNIGHT,
  "b": WHITE_BISHOP,
  "q": WHITE_QUEEN,
  "k": WHITE_KING,
  "p": WHITE_PAWN,
  "e": WHITE_EDGEDANCER,
  "s": WHITE_SQUIRE,
  "t": WHITE_LITERATE_KNIGHT,
  "l": WHITE_LANCER,
  "o": WHITE_BLOCKER,
  "a": WHITE_ARCHER,
  "c": WHITE_CROISSANT,
  "u": WHITE_SUPER_PAWN,
  "y": WHITE_SPY,
  "j": WHITE_JUMPER,
  "i": WHITE_LEAPER,
  "d": WHITE_PRIEST,
  "w": WHITE_WARLOCK,
  "z": WHITE_PEASANT,
}

PAWN_LIKE_PIECES = ["Pawn", "SuperPawn", "Spy", "Warlock", "Lancer", "Jumper", "Croissant"]
PROMOTABLE_PIECES = ["Edgedancer", "LiterateKnight", "Archer", "Squire", "Priest", "Peasant", "Blocker", "Queen"]

PASSANTING_PIECES = ["Pawn", "SuperPawn", "Spy", "Warlock", "Jumper", "Croissant"]
CROISSANTING_PIECES = ["Croissant"]

COLOR_NAMES = ["White", "Black"]
LEAPERS = ["Knight", "Squire", "LiterateKnight"]

MOVESETS = {
  "Rook": genPusherMoves(1, 0),
  "Knight": genLeaperMoves(2, 1),
  "Bishop": genPusherMoves(1, 1),
  "Queen": queenMoves,
  "King": kingMoves,
  "Pawn": pawnMoves,
  "Edgedancer": edgedancerMoves,
  "Squire": combine(genLeaperMoves(1, 0), genLeaperMoves(2, 0)),
  "LiterateKnight": combine(combine(combine(genLeaperMoves(0, 0), genLeaperMoves(1, 0)), combine(genLeaperMoves(2, 0), genLeaperMoves(3, 0))), combine(genLeaperMoves(1, 1), genLeaperMoves(2, 1))),
  "Lancer": genPusherMoves(0, -1, -1, true),
  "Blocker": blockerMoves,
  "Archer": archerMoves,
  "Croissant": croissantMoves,
  "SuperPawn": pawnMoves,
  "Spy": pawnMoves,
  "Jumper": jumperMoves,
  "Leaper": leaperMoves,
  "Priest": priestMoves,
  "Warlock": warlockMoves,
  "Peasant": peasantMoves
}
