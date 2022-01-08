import {
  ChessPiece,
  ChessSVG,
  IBoardSpot,
  IChessPiece,
  IPossibleMoves,
} from "./Interfaces";
import { colLettersArray, ISquareCoreProps } from "./Square";

export interface IGameState {
  squares: ISquareCoreProps[][];
  fen: string;
  isWhitesTurn?: boolean;
  castlingRights?: string;
  enPassantTarget?: string;
  halfmoveClock?: number;
  fullmoveNumber?: number;
  isInCheck?: boolean;
  allPossibleMoves?: IPossibleMoves;
}

export function generateStateFromFen(f: string): IGameState {
  const space = f.indexOf(" ");
  const fenPieces = f.substring(0, space === -1 ? undefined : space);
  const remain = f.substring(space + 1).split(" ");

  const squaresOut = translateFenToSquaresArray(fenPieces);
  // remain[0] is whoever's turn it is
  // remain[1] is castle-rights
  // remain[2] is en passant target square, or '-'
  // remain[3] is half-move clock
  // remain[4] is full move number

  if (!remain) {
    console.error(
      "Invalid FEN notation sent over, couldn't find extra information."
    );
    return { squares: squaresOut, fen: f };
  } else {
    const [turn, castleRights, enPassantTarget, halfMoveClock, fullMoveNumber] =
      remain;

    if (remain.length < 5) {
      console.error(
        "Invalid FEN notation sent over, couldn't find all add'l info."
      );
      return { squares: squaresOut, fen: f };
    }

    let halfMoveClockNum = -1,
      fullMoveNumberNum = -1;
    if (!isNaN(+halfMoveClock) && !isNaN(+fullMoveNumber)) {
      halfMoveClockNum = parseInt(halfMoveClock);
      fullMoveNumberNum = parseInt(fullMoveNumber);
    } else {
      console.error("Halfmove clock or fullmove number invalid.");
    }

    const isWhitesTurn = turn === "w";
    const playerIsInCheck = isInCheck(squaresOut, isWhitesTurn);

    const allPossiblesMoves: IPossibleMoves = getAllPossibleMoves(
      squaresOut,
      isWhitesTurn,
      castleRights,
      enPassantTarget,
      false,
      playerIsInCheck
    );

    return {
      squares: squaresOut,
      fen: f,
      isWhitesTurn: isWhitesTurn,
      castlingRights: castleRights,
      enPassantTarget: enPassantTarget,
      halfmoveClock: halfMoveClockNum,
      fullmoveNumber: fullMoveNumberNum,
      isInCheck: playerIsInCheck,
      allPossibleMoves: allPossiblesMoves,
    };
  }
}

export function moveToSquare(
  targetSquare: ISquareCoreProps,
  movingSquare: ISquareCoreProps,
  squares: ISquareCoreProps[][],
  isWhitesTurn: boolean,
  enPassantTarget: string
): string | undefined {
  const squaresCopy: ISquareCoreProps[][] = deepCopyFunction(squares);
  if (!movingSquare.occupiedPiece) return;
  const {
    row: targetRow,
    column: targetCol,
    success,
  } = getRowAndColumnFromPiece(targetSquare);
  const {
    row: movingRow,
    column: movingCol,
    success: success2,
  } = getRowAndColumnFromPiece(movingSquare);

  const pieceCopy: IChessPiece = deepCopyFunction(movingSquare.occupiedPiece);

  // Deal with special cases

  // Help with castling if we're doing it
  if (movingSquare.occupiedPiece.piece.name === ChessPiece.King) {
    if (Math.abs(movingCol - targetCol) === 2) {
      // We need to also move the rook to the square next to the king
      let rookColumn = 0,
        castlingLong = true;
      if (targetCol === 6) {
        rookColumn = 7;
        castlingLong = false;
      }

      const rookPiece: IChessPiece = deepCopyFunction(
        squaresCopy[movingRow][rookColumn].occupiedPiece
      );
      const columnToMoveTo = Math.abs(castlingLong ? 3 : 2 - rookColumn);
      squaresCopy[movingRow][columnToMoveTo].occupiedPiece = rookPiece;
      squaresCopy[movingRow][rookColumn].occupiedPiece = undefined;
    }
  }

  // Promote a pawn to a queen if it hits the last row
  if (
    movingSquare.occupiedPiece.piece.name === ChessPiece.Pawn &&
    ((targetRow === 7 && !isWhitesTurn) || (targetRow === 0 && isWhitesTurn))
  ) {
    pieceCopy.piece.name = ChessPiece.Queen;
  }

  // Remove the pawn captured via en passant if that's what we did
  if (
    movingSquare.occupiedPiece.piece.name === ChessPiece.Pawn &&
    getBoardSpotFromPiece(targetSquare) === enPassantTarget
  ) {
    squaresCopy[movingRow][targetCol].occupiedPiece = undefined;
  }

  if (success && success2) {
    squaresCopy[targetRow][targetCol].occupiedPiece = pieceCopy;
    squaresCopy[movingRow][movingCol].occupiedPiece = undefined;
    return translateSquaresToFen(squaresCopy);
  }
}

export function calculateGamePgn(gameStateArray: IGameState[]): string[] {
  let isWhitesTurn = true; // White always starts first in chess...
  let ret: string[] = [];
  for (let i = 1; i < gameStateArray.length; ++i) {
    ret.push(calculatePgn(gameStateArray[i - 1], gameStateArray[i]));
    isWhitesTurn = !isWhitesTurn;
  }
  return ret;
}

function arePiecesTheSame(p1: ISquareCoreProps, p2: ISquareCoreProps): boolean {
  if (p1.occupiedPiece && p2.occupiedPiece) {
    return (
      p1.occupiedPiece.color === p2.occupiedPiece.color &&
      p1.occupiedPiece.piece.name === p2.occupiedPiece.piece.name
    );
  } else {
    // comparing for undefined === undefined
    return p1.occupiedPiece === p2.occupiedPiece;
  }
}

export function calculatePgn(g1: IGameState, g2: IGameState): string {
  let piecesDifferences: ISquareCoreProps[][] = [];
  const s1 = g1.squares;
  const s2 = g2.squares;

  for (let i = 0; i < 8; ++i) {
    for (let j = 0; j < 8; ++j) {
      if (!arePiecesTheSame(s1[i][j], s2[i][j])) {
        piecesDifferences.push([s1[i][j], s2[i][j]]);
      }
    }
  }

  const len = piecesDifferences.length;
  let retVal = "";
  if (len === 2) {
    // Normal move
    // [
    //   [s1, s1b] boardSpot1
    //   [s2, s2b] boardSpot2
    // ]
    const [boardSpot1, boardSpot2] = piecesDifferences;
    const [s1, s1b] = boardSpot1;
    const [s2, s2b] = boardSpot2;
    let initialSquare: ISquareCoreProps | undefined = undefined;
    let targetSquare: ISquareCoreProps | undefined = undefined;
    let targetBoardSpot = "";
    let wasSomethingCaptured = false;

    if (s1.occupiedPiece && s2.occupiedPiece) {
      // something was captured, find the empty spot (which indicates that's where the piece moved from)
      wasSomethingCaptured = true;
      initialSquare = s1b.occupiedPiece ? s2 : s1;
      targetSquare = s1b.occupiedPiece ? s1b : s2b; // Final destination, should always be "b"
      targetBoardSpot = getBoardSpotFromPiece(targetSquare);
    } else {
      // We either moved s1 to s2b, or s2 to s1b
      initialSquare = s1.occupiedPiece ? s1 : s2;
      targetSquare = s1.occupiedPiece ? s2b : s1b; // Final destination, should always be "b"
      targetBoardSpot = getBoardSpotFromPiece(targetSquare);
    }

    const movingLetter = getPieceThatMovedLetter(initialSquare, wasSomethingCaptured);
    const specialIdentifier = getSpecialRowNumberOrColumnName(g1, initialSquare, targetSquare);
    const capturedLetter = wasSomethingCaptured ? "x" : "";
    const promotionLetters = getPromotionLetters(g1, initialSquare, targetSquare);
    retVal = `${movingLetter}${specialIdentifier}${capturedLetter}${targetBoardSpot}${promotionLetters}`;

  } else if (len === 3) {
    // en passant capture
    const [boardSpot1, boardSpot2, boardSpot3] = piecesDifferences;
    const [s1, s1b] = boardSpot1;
    const [s2, s2b] = boardSpot2;
    const [s3, s3b] = boardSpot3;

    // Whichever of s1b, s2b, and s3b has a piece is the destination
    const destinationSquare = s1b.occupiedPiece
      ? s1b
      : s2b.occupiedPiece
      ? s2b
      : s3b;
    const destinationPieceColor = destinationSquare.occupiedPiece?.color;

    // Originating row is whichever row matches the destination square's piece color
    const [p1, p2] = [s1.occupiedPiece, s2.occupiedPiece];
    const originalColumn = (
      p1?.color === destinationPieceColor
        ? getBoardSpotFromPiece(s1)
        : p2?.color === destinationPieceColor
        ? getBoardSpotFromPiece(s2)
        : getBoardSpotFromPiece(s3)
    )[0];

    retVal = `${originalColumn}x${getBoardSpotFromPiece(destinationSquare)}`;
  } else if (len === 4) {
    // castling
    // Just need to determine if the rook moved two or three squares
    // We castled queen-side if the rook lands on the d file...
    const p2 = piecesDifferences[1][0];
    retVal = p2.columnName === "c" ? "O-O-O" : "O-O";
  }

  const isCheck = g2.isInCheck;
  const moves = g2.allPossibleMoves;
  const isCheckmate = isCheck && moves && moves.possibleMoves === 0;

  return `${retVal}${isCheck ? (isCheckmate ? "#" : "+") : ""}`;
}

function getPromotionLetters(g: IGameState, initialSquare: ISquareCoreProps, targetSquare: ISquareCoreProps) {
  const targetColumn = targetSquare.rowNumber;
  const pieceThatMoved = initialSquare.occupiedPiece?.piece.name;

  if (pieceThatMoved === ChessPiece.Pawn) {
    if (targetColumn === 1 || targetColumn === 8) {
      // The pawn promoted this turn, return what it promoted to
      return `=${getPieceThatMovedLetter(targetSquare, false)}`;
    }
  }
  return "";
}

function getSpecialRowNumberOrColumnName(
  g: IGameState,
  initialSquare: ISquareCoreProps,
  targetSquare: ISquareCoreProps
): number | typeof colLettersArray[number] | ""  {
  const initialBoardSpot = getBoardSpotFromPiece(initialSquare);
  const targetBoardSpot = getBoardSpotFromPiece(targetSquare);
  const pieceThatMoved = initialSquare.occupiedPiece?.piece.name;
  if (pieceThatMoved && pieceThatMoved !== ChessPiece.Pawn && g.allPossibleMoves) {
    // Find all other pieces that could have moved to the target board spot
    const squaresThatCouldAlsoMoveToTarget = getAllKeysThatContainValue(
      targetBoardSpot,
      g.allPossibleMoves.allMoves
    );
    for (let i = 0; i < squaresThatCouldAlsoMoveToTarget.length; ++i) {
      const boardSpotToCheck = squaresThatCouldAlsoMoveToTarget[i];
      if (boardSpotToCheck !== initialBoardSpot) {
        const squareToCheck = getPieceFromBoardSpot(
          boardSpotToCheck,
          g.squares
        );
        if (squareToCheck?.occupiedPiece?.piece.name === pieceThatMoved) {
          //${pieceThatMoved} could also have jumped from ${boardSpotToCheck}

          // We need to add some information about the piece that moved, first try the column name
          // And if those match, use the row number
          if (initialSquare.columnName !== squareToCheck.columnName) {
            return initialSquare.columnName;
          } else if (initialSquare.rowNumber !== squareToCheck.rowNumber) {
            return initialSquare.rowNumber;
          }
        }
      }
    }
  }
  return ""; // Return nothing special to display if not necessary
}

function getAllKeysThatContainValue(
  val: string,
  kvPairs: Map<string, string[]>
): string[] {
  let retVal: string[] = [];
  for (let [key, value] of kvPairs.entries()) {
    if (value.includes(val)) {
      retVal.push(key);
    }
  }
  return retVal;
}

export function isOnScreen(
  moveElem: HTMLDivElement,
  moveListElem: HTMLDivElement
) {
  const height = moveListElem.clientHeight;
  const scrollPos = moveListElem.scrollTop + moveListElem.offsetTop;
  const elemPos = moveElem.offsetTop;
  if (elemPos >= scrollPos && elemPos < scrollPos + height) {
    return true;
  }
  return false;
}

function getPieceThatMovedLetter(piece: ISquareCoreProps, isCapture: boolean) {
  let pieceThatMovedLetter = "";
  switch (piece.occupiedPiece?.piece.name) {
    case ChessPiece.Bishop:
      pieceThatMovedLetter = "B";
      break;
    case ChessPiece.King:
      pieceThatMovedLetter = "K";
      break;
    case ChessPiece.Knight:
      pieceThatMovedLetter = "N";
      break;
    case ChessPiece.Queen:
      pieceThatMovedLetter = "Q";
      break;
    case ChessPiece.Rook:
      pieceThatMovedLetter = "R";
      break;
    case ChessPiece.Pawn:
      if (isCapture) pieceThatMovedLetter = getBoardSpotFromPiece(piece)[0];
      break;
  }

  // Edge cases -> a non-pawn moves where a sibling could also move (consider all pieces b/c pawn promotions)

  return pieceThatMovedLetter;
}

export function translateFenToSquaresArray(f: string): ISquareCoreProps[][] {
  f = f.trim();
  let ret: ISquareCoreProps[][] = [];
  for (let i = 0; i < 8; ++i) {
    ret[i] = new Array(8);
  }
  let row = 0,
    column = 0,
    i = 0;
  for (i = 0; i < f.length; ++i) {
    let char = f[i];
    if (char === " ") break;
    let piece = getPieceFromFenChar(char);
    if (piece === undefined) {
      // it's either '/' or a number
      if (char === "/") {
        row += 1;
      } else if (parseInt(char)) {
        for (let j = 0; j < parseInt(char); j++) {
          pushSafely(ret, column, row);
          column = (column + 1) % 8;
        }
      }
    } else {
      pushSafely(ret, column, row, piece);
      column = (column + 1) % 8;
    }
  }

  return ret;
}

export function deepCopyFunction(inObject: any): any {
  let outObject: any, value, key;

  if (typeof inObject !== "object" || inObject === null) {
    return inObject; // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  outObject = Array.isArray(inObject) ? [] : {};

  for (key in inObject) {
    value = inObject[key];
    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = deepCopyFunction(value);
  }

  return outObject;
}

function validateTentativeMove(
  squares: ISquareCoreProps[][],
  init: ISquareCoreProps,
  tar: ISquareCoreProps,
  isWhitesTurn: boolean
): boolean {
  // Performs a move and returns whether or not that move results in the
  // player being in check
  const copy: ISquareCoreProps[][] = deepCopyFunction(squares);

  const { row, column } = getRowAndColumnFromPiece(init);
  const { row: targetRow, column: targetColumn } =
    getRowAndColumnFromPiece(tar);

  copy[targetRow][targetColumn].occupiedPiece = copy[row][column].occupiedPiece;
  copy[row][column].occupiedPiece = undefined;

  return !isInCheck(copy, isWhitesTurn);
}

export function getKingLocation(
  squares: ISquareCoreProps[][],
  colorToCheck: "white" | "black"
): string | undefined {
  for (let i = 0; i < 8; ++i) {
    for (let j = 0; j < 8; ++j) {
      let square = squares[i][j];
      if (
        square.occupiedPiece &&
        square.occupiedPiece.color === colorToCheck &&
        square.occupiedPiece.piece.name === ChessPiece.King
      ) {
        return getBoardSpotFromPiece(square);
      }
    }
  }
}

export function calculateNewCastleRights(
  castlingRights: string | undefined,
  nameOfPieceThatIsMoving: ChessPiece | undefined,
  castleRights: string | undefined,
  isWhitesTurn: boolean,
  selectedSquare: ISquareCoreProps
) {
  if (
    castlingRights !== "-" &&
    (nameOfPieceThatIsMoving === ChessPiece.Rook ||
      nameOfPieceThatIsMoving === ChessPiece.King)
  ) {
    // We only care if there are some castling rights and a king or rook moved
    // let whiteRights = (/K*Q*KQ/.exec(castlingRights || "") || ["-"])[0];
    // let blackRights = (/k*q*kq/.exec(castlingRights || "") || ["-"])[0];
    // let weCareAbout = isWhitesTurn ? whiteRights : blackRights;
    const removeEverythingWhite = /(KQ|K|Q)/;
    const removeEverythingBlack = /(kq|k|q)/;
    const removeQueensideWhite = /Q/;
    const removeQueensideBlack = /q/;
    const removeKingsideWhite = /K/;
    const removeKingsideBlack = /k/;
    if (nameOfPieceThatIsMoving === ChessPiece.King) {
      castleRights = castleRights?.replace(
        isWhitesTurn ? removeEverythingWhite : removeEverythingBlack,
        ""
      );
    } else {
      // the rook is moving
      const bs = getBoardSpotFromPiece(selectedSquare);
      if (bs === "a1" && isWhitesTurn) {
        castleRights = castleRights?.replace(removeQueensideWhite, "");
      } else if (bs === "a8" && !isWhitesTurn) {
        castleRights = castleRights?.replace(removeQueensideBlack, "");
      } else if (bs === "h1" && isWhitesTurn) {
        castleRights = castleRights?.replace(removeKingsideWhite, "");
      } else if (bs === "h8" && !isWhitesTurn) {
        castleRights = castleRights?.replace(removeKingsideBlack, "");
      }
    }
  }
  return castleRights;
}

export function isInCheck(
  squares: ISquareCoreProps[][],
  isWhitesTurn: boolean
): boolean {
  const colorToCheck = isWhitesTurn ? "white" : "black";
  const kingLocation = getKingLocation(squares, colorToCheck);
  if (!kingLocation) return false;

  const possibleMovesForOtherPlayer = getAllPossibleMoves(
    squares,
    !isWhitesTurn,
    undefined,
    undefined,
    true
  );

  if (possibleMovesForOtherPlayer.allMoves) {
    for (let [, value] of possibleMovesForOtherPlayer.allMoves.entries()) {
      if (value.includes(kingLocation)) {
        return true;
      }
    }
  }

  return false;
}

function pushIfPossible(
  squares: ISquareCoreProps[][],
  possibleMoves: string[],
  init: ISquareCoreProps,
  tar: ISquareCoreProps,
  isWhitesTurn: boolean,
  ignoreChecks?: boolean
) {
  if (ignoreChecks) {
    possibleMoves.push(getBoardSpotFromPiece(tar));
  } else if (validateTentativeMove(squares, init, tar, isWhitesTurn)) {
    possibleMoves.push(getBoardSpotFromPiece(tar));
  }
}

export function identifySquaresToMoveTo(
  squaresArray: ISquareCoreProps[][],
  initialSquare: ISquareCoreProps,
  castleRights?: string,
  enPassantTarget?: string,
  ignoreChecks?: boolean,
  currentlyInCheck?: boolean
): string[] | undefined {
  if (!initialSquare.occupiedPiece) return;

  const piece = initialSquare.occupiedPiece.piece;
  const color = initialSquare.occupiedPiece.color;
  const isWhitesTurn = color === "white";
  const { row, column } = getRowAndColumnFromPiece(initialSquare);
  let possibleMoves: string[] = [];

  // Pawn
  if (piece.name === ChessPiece.Pawn) {
    enPassantTarget = enPassantTarget?.toUpperCase();
    // Find which direction it's going
    const inc = !isWhitesTurn ? 1 : -1;
    // Pawns can advance one square forward (if the square is unoccupied)
    const oneSpaceForward = squaresArray[row + inc][column];

    if (!oneSpaceForward.occupiedPiece) {
      pushIfPossible(
        squaresArray,
        possibleMoves,
        initialSquare,
        oneSpaceForward,
        isWhitesTurn,
        ignoreChecks
      );
      // Also allow moving two spaces when we're on the starting block and nothing blocking
      if (
        (!isWhitesTurn && initialSquare.rowNumber === 7) ||
        (isWhitesTurn && initialSquare.rowNumber === 2)
      ) {
        const twoSpacesForward = squaresArray[row + inc * 2][column];
        if (!twoSpacesForward.occupiedPiece) {
          pushIfPossible(
            squaresArray,
            possibleMoves,
            initialSquare,
            twoSpacesForward,
            isWhitesTurn,
            ignoreChecks
          );
        }
      }
    }

    const addIfValid = (
      squares: ISquareCoreProps[][],
      row: number,
      column: number,
      enPassantTarget: string | undefined,
      moves: string[]
    ) => {
      if (isValidSquare(row, column)) {
        const oneSpaceDiag = squares[row][column];
        const boardSpot = getBoardSpotFromPiece(oneSpaceDiag);
        const piece = oneSpaceDiag.occupiedPiece;
        if (
          (piece && piece.color !== initialSquare.occupiedPiece?.color) ||
          boardSpot === enPassantTarget
        ) {
          pushIfPossible(
            squares,
            moves,
            initialSquare,
            oneSpaceDiag,
            isWhitesTurn,
            ignoreChecks
          );
        }
      }
    };

    addIfValid(
      squaresArray,
      row + inc,
      column + 1,
      enPassantTarget,
      possibleMoves
    );
    addIfValid(
      squaresArray,
      row + inc,
      column - 1,
      enPassantTarget,
      possibleMoves
    );
  } // Knight
  else if (piece.name === ChessPiece.Knight) {
    const moves = [
      [-1, 2],
      [-2, 1],
      [-2, -1],
      [-1, -2],
    ];
    const otherMoves = moves.map((n) => n.map((l) => -l));
    const allMoves = moves.concat(otherMoves);

    getValidMovesFromArray(
      squaresArray,
      possibleMoves,
      allMoves,
      initialSquare,
      color,
      ignoreChecks
    );
  } // Bishop
  else if (piece.name === ChessPiece.Bishop) {
    const directions = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    getValidMovesFromArray(
      squaresArray,
      possibleMoves,
      directions,
      initialSquare,
      color,
      ignoreChecks
    );
  } // Rook
  else if (piece.name === ChessPiece.Rook) {
    const directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    getValidMovesFromArray(
      squaresArray,
      possibleMoves,
      directions,
      initialSquare,
      color,
      ignoreChecks
    );
  } // Queen
  else if (piece.name === ChessPiece.Queen) {
    const rookDirections = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    const bishopDirections = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    const directions = rookDirections.concat(bishopDirections);
    getValidMovesFromArray(
      squaresArray,
      possibleMoves,
      directions,
      initialSquare,
      color,
      ignoreChecks
    );
  } // King
  else if (piece.name === ChessPiece.King) {
    const rookDirections = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    const bishopDirections = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    const directions = rookDirections.concat(bishopDirections);
    getValidMovesFromArray(
      squaresArray,
      possibleMoves,
      directions,
      initialSquare,
      color,
      ignoreChecks
    );

    // Add castling possibilities as well
    if (castleRights && !currentlyInCheck) {
      const { row, column } = getRowAndColumnFromPiece(initialSquare);
      const currentCastlingRights = getSpecificCastlingRights(
        castleRights,
        isWhitesTurn
      );
      for (let i = 0; i < currentCastlingRights.length; ++i) {
        let char = currentCastlingRights[i];
        if (char.toLowerCase() === "k") {
          // can castle king-side
          const oneSquareRight = squaresArray[row][column + 1];
          const twoSquaresRight = squaresArray[row][column + 2];
          if (
            oneSquareRight.occupiedPiece === undefined &&
            twoSquaresRight.occupiedPiece === undefined
          ) {
            if (
              validateTentativeMove(
                squaresArray,
                initialSquare,
                oneSquareRight,
                isWhitesTurn
              ) &&
              validateTentativeMove(
                squaresArray,
                initialSquare,
                twoSquaresRight,
                isWhitesTurn
              )
            ) {
              possibleMoves.push(getBoardSpotFromPiece(twoSquaresRight));
            }
          }
        } else if (char.toLowerCase() === "q") {
          const oneSquareLeft = squaresArray[row][column - 1];
          const twoSquaresLeft = squaresArray[row][column - 2];
          const threeSquaresLeft = squaresArray[row][column - 3];
          if (
            oneSquareLeft.occupiedPiece === undefined &&
            twoSquaresLeft.occupiedPiece === undefined &&
            threeSquaresLeft.occupiedPiece === undefined
          ) {
            if (
              validateTentativeMove(
                squaresArray,
                initialSquare,
                oneSquareLeft,
                isWhitesTurn
              ) &&
              validateTentativeMove(
                squaresArray,
                initialSquare,
                twoSquaresLeft,
                isWhitesTurn
              )
            ) {
              possibleMoves.push(getBoardSpotFromPiece(twoSquaresLeft));
            }
          }
        }
      }
    }
  }

  return possibleMoves;
}

function getSpecificCastlingRights(
  castlingRights: string,
  isWhitesTurn: boolean
) {
  const everythingWhite = /(KQ|K|Q)/;
  const everythingBlack = /(kq|k|q)/;
  return ((isWhitesTurn ? everythingWhite : everythingBlack).exec(
    castlingRights
  ) || [""])[0];
}

export function isValidSquare(row: number, column: number) {
  return row > -1 && row < 8 && column > -1 && column < 8;
}

export function getValidMovesFromArray(
  squares: ISquareCoreProps[][],
  possibleMoves: string[],
  moveArray: number[][],
  initialSquare: ISquareCoreProps,
  color: "white" | "black",
  ignoreChecks?: boolean
) {
  let returnArray: string[] = [];
  let targetSquare: ISquareCoreProps | undefined;
  const pieceName = initialSquare.occupiedPiece?.piece.name;
  const shouldLoop = !(
    pieceName === ChessPiece.King ||
    pieceName === ChessPiece.Knight ||
    pieceName === ChessPiece.Pawn
  );
  moveArray.forEach((dir) => {
    targetSquare = initialSquare;
    do {
      let [rowInc, colInc] = dir;
      let { row: currRow, column: currColumn } =
        getRowAndColumnFromPiece(targetSquare);
      let [targetRow, targetCol] = [currRow + rowInc, currColumn + colInc];
      if (isValidSquare(targetRow, targetCol)) {
        targetSquare = squares[targetRow][targetCol];
        if (
          !targetSquare.occupiedPiece ||
          targetSquare.occupiedPiece.color !== color
        ) {
          pushIfPossible(
            squares,
            possibleMoves,
            initialSquare,
            targetSquare,
            color === "white",
            ignoreChecks
          );
        }
      } else {
        targetSquare = undefined;
      }
    } while (targetSquare && !targetSquare.occupiedPiece && shouldLoop);
  });

  return returnArray;
}

export function getRowAndColumnFromPiece(piece: ISquareCoreProps): IBoardSpot {
  return getColumnAndRowFromBoardSpot(getBoardSpotFromPiece(piece));
}

export function getBoardSpotFromPiece(piece: ISquareCoreProps): string {
  return piece.columnName + piece.rowNumber;
}

export function getAllPossibleMoves(
  squaresArray: ISquareCoreProps[][],
  isWhitesTurn: boolean,
  castleRights?: string,
  enPassantTarget?: string,
  ignoreChecks?: boolean,
  currentlyInCheck?: boolean
): IPossibleMoves {
  let dict: Map<string, string[]> = new Map();
  let totalPossibleMoves = 0;
  let possibleMoves: string[] | undefined;

  const colorToLoopOver = isWhitesTurn ? "white" : "black";

  for (let i = 0; i < 8; ++i) {
    for (let j = 0; j < 8; ++j) {
      let square = squaresArray[i][j];
      if (
        square.occupiedPiece &&
        square.occupiedPiece.color === colorToLoopOver
      ) {
        possibleMoves = identifySquaresToMoveTo(
          squaresArray,
          square,
          castleRights,
          enPassantTarget,
          ignoreChecks,
          currentlyInCheck
        );
        if (possibleMoves) {
          totalPossibleMoves += possibleMoves.length;
          dict.set(getBoardSpotFromPiece(square), possibleMoves);
        } else {
          // always provide the array, i guess?
          dict.set(getBoardSpotFromPiece(square), []);
        }
      }
    }
  }

  return { allMoves: dict, possibleMoves: totalPossibleMoves };
}

export function getPieceFromBoardSpot(
  boardSpot: string,
  squares: ISquareCoreProps[][]
): ISquareCoreProps | undefined {
  const { row, column, success } = getColumnAndRowFromBoardSpot(boardSpot);
  if (success) {
    return squares[row][column];
  }
}

export function getColumnAndRowFromBoardSpot(boardSpot: string): IBoardSpot {
  const badReturn: IBoardSpot = { row: -1, column: -1, success: false };
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const columnSpot = boardSpot[0].toUpperCase();
  const colNumber = cols.indexOf(columnSpot);

  if (colNumber === -1) {
    console.error("Couldn't find that column");
    return badReturn;
  }

  if (isNaN(+boardSpot[1])) {
    console.error("Row number is not a number.");
    return badReturn;
  }

  const rowSpot = 8 - parseInt(boardSpot[1]);
  return { row: rowSpot, column: colNumber, success: true };
}

export function translateSquaresToFen(squares: ISquareCoreProps[][]): string {
  let ret = "";
  squares.forEach((row) => {
    row.forEach((square) => {
      if (square.occupiedPiece) {
        const char = getFenCharFromPiece(square.occupiedPiece);
        ret += char;
      } else {
        // It's a blank square, so add a 1 or increment the previous digit
        const prevDigit = ret[ret.length - 1];
        if (!isNaN(+prevDigit)) {
          const inc = parseInt(prevDigit) + 1;
          ret = ret.substring(0, ret.length - 1) + inc;
        } else {
          ret += "1";
        }
      }
    });
    ret += "/";
  });

  ret = ret.substring(0, ret.length - 1); // remove the extraneous /

  return ret;
}

export function getFenCharFromPiece(pieceObj: IChessPiece) {
  let char = "";
  switch (pieceObj.piece.name) {
    case ChessPiece.Rook:
      char = "r";
      break;
    case ChessPiece.Bishop:
      char = "b";
      break;
    case ChessPiece.King:
      char = "k";
      break;
    case ChessPiece.Knight:
      char = "n";
      break;
    case ChessPiece.Pawn:
      char = "p";
      break;
    case ChessPiece.Queen:
      char = "q";
      break;
    default:
      break;
  }

  if (char !== "") {
    if (pieceObj.color === "white") {
      return char.toUpperCase();
    } else {
      return char;
    }
  }
  return "";
}

export function getPieceFromFenChar(elem: string): IChessPiece | undefined {
  let piece: IChessPiece | undefined = undefined;

  switch (elem) {
    case "r":
      piece = {
        color: "black",
        piece: { name: ChessPiece.Rook, iconSvg: ChessSVG.Rook },
      };
      break;
    case "n":
      piece = {
        color: "black",
        piece: { name: ChessPiece.Knight, iconSvg: ChessSVG.Knight },
      };
      break;
    case "b":
      piece = {
        color: "black",
        piece: { name: ChessPiece.Bishop, iconSvg: ChessSVG.Bishop },
      };
      break;
    case "k":
      piece = {
        color: "black",
        piece: { name: ChessPiece.King, iconSvg: ChessSVG.King },
      };
      break;
    case "q":
      piece = {
        color: "black",
        piece: { name: ChessPiece.Queen, iconSvg: ChessSVG.Queen },
      };
      break;
    case "p":
      piece = {
        color: "black",
        piece: { name: ChessPiece.Pawn, iconSvg: ChessSVG.Pawn },
      };
      break;
    case "R":
      piece = {
        color: "white",
        piece: { name: ChessPiece.Rook, iconSvg: ChessSVG.Rook },
      };
      break;
    case "N":
      piece = {
        color: "white",
        piece: { name: ChessPiece.Knight, iconSvg: ChessSVG.Knight },
      };
      break;
    case "B":
      piece = {
        color: "white",
        piece: { name: ChessPiece.Bishop, iconSvg: ChessSVG.Bishop },
      };
      break;
    case "K":
      piece = {
        color: "white",
        piece: { name: ChessPiece.King, iconSvg: ChessSVG.King },
      };
      break;
    case "Q":
      piece = {
        color: "white",
        piece: { name: ChessPiece.Queen, iconSvg: ChessSVG.Queen },
      };
      break;
    case "P":
      piece = {
        color: "white",
        piece: { name: ChessPiece.Pawn, iconSvg: ChessSVG.Pawn },
      };
      break;
    default:
      break;
  }
  return piece;
}

export function pushSafely(
  squares: ISquareCoreProps[][],
  column: number,
  row: number,
  piece?: IChessPiece
) {
  // We receive rows/columns 0-indexed, from top (8th rank) to bottom (1st rank)
  // e.g., b7 should be row = 1, col = 1
  if (column > 7 || row > 7) {
    console.error("Trying to add out of bounds.");
    console.error(`Column: ${column}, row: ${row}`);
    return;
  }

  let squareColor: "dark" | "light" = "dark"; // assume one of the colors
  if (row % 2 === 0) {
    // It's a row that starts with light squares
    if (column % 2 === 0) {
      squareColor = "light";
    }
  } else {
    // It's a row that starts with dark squares
    if (column % 2 !== 0) {
      squareColor = "light";
    }
  }

  squares[row][column] = {
    color: squareColor,
    columnName: colLettersArray[column],
    rowNumber: 8 - row,
    occupiedPiece: piece,
  };
}
