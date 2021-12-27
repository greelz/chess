import Board from "./Board";
import { useState, useMemo, FC } from "react";
import {
  ChessPiece,
  IChessPiece,
  translateFenToSquaresArray,
  translateSquaresToFen,
} from "./Helpers";
import { ISquareCoreProps } from "./Square";

interface IGameProps {
  startingFen: string;
}

interface IBoardSpot {
  row: number;
  column: number;
  success: boolean;
}

export default function Game(props: IGameProps): JSX.Element {
  //   function jumpTo(point: number) {
  //     if (point >= 0 && point < gameHistory.length) {
  //       setCurrentPointInHistory(point);
  //     }
  //   }

  const doNewMove = (newFen: string) => {
    setGameHistory((prev) => [...prev, newFen]);
    const len = gameHistory.length;
    setCurrentPointInHistory(len);
  };

  function getRowAndColumnFromPiece(piece: ISquareCoreProps): IBoardSpot {
    return getColumnAndRowFromBoardSpot(getBoardSpotFromPiece(piece));
  }

  function getBoardSpotFromPiece(piece: ISquareCoreProps) {
    return piece.columnName + piece.rowNumber;
  }

  function getColumnAndRowFromBoardSpot(boardSpot: string): IBoardSpot {
    const badReturn: IBoardSpot = { row: -1, column: -1, success: false };
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const columnSpot = boardSpot[0].toUpperCase();
    const colNumber = cols.indexOf(columnSpot);

    if (colNumber === -1) {
      console.log("Couldn't find that column");
      return badReturn;
    }

    if (isNaN(+boardSpot[1])) {
      console.log("Row number is not a number.");
      return badReturn;
    }

    const rowSpot = 8 - parseInt(boardSpot[1]);
    return { row: rowSpot, column: colNumber, success: true };
  }

  function getSelectedSquare(
    squares: ISquareCoreProps[][]
  ): ISquareCoreProps | undefined {
    for (let i = 0; i < 8; ++i) {
      for (let j = 0; j < 8; ++j) {
        if (squares[i][j].selected) {
          return squares[i][j];
        }
      }
    }
  }

  function deselectSelectedSquare(squares: ISquareCoreProps[][]) {
    const selectedSquare = getSelectedSquare(squares);
    if (selectedSquare) {
      const { row, column, success } = getRowAndColumnFromPiece(selectedSquare);
      if (success) {
        squares.map((row) => row.map((val) => (val.canBeMovedTo = false)));
        squares[row][column].selected = false;
      }
    }
  }

  function isValidSquare(row: number, column: number) {
    return row > -1 && row < 8 && column > -1 && column < 8;
  }

  function calculateValidMovesFromArray(
    squares: ISquareCoreProps[][],
    moveArray: number[][],
    initialSquare: ISquareCoreProps,
    color: "white" | "black"
  ) {
    let targetSquare: ISquareCoreProps | undefined;
    const pieceName = initialSquare.occupiedPiece?.piece.name;
    const shouldLoop =
      pieceName === ChessPiece.King ||
      pieceName === ChessPiece.Knight ||
      pieceName === ChessPiece.Pawn;
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
            targetSquare.canBeMovedTo = true;
          }
        } else {
          targetSquare = undefined;
        }
      } while (targetSquare && !targetSquare.occupiedPiece && !shouldLoop);
    });
  }

  function identifySquaresToMoveTo(
    squares: ISquareCoreProps[][],
    initialSquare: ISquareCoreProps
  ) {
    if (!initialSquare.occupiedPiece) return;
    squares.map((row) => row.map((val) => (val.canBeMovedTo = false)));

    const piece = initialSquare.occupiedPiece.piece;
    const color = initialSquare.occupiedPiece.color;
    const { row, column } = getRowAndColumnFromPiece(initialSquare);

    // Pawn
    if (piece.name === ChessPiece.Pawn) {
      // Find which direction it's going
      const inc = color === "black" ? 1 : -1;
      // Pawns can advance one square forward (if the square is unoccupied)
      const oneSpaceForward = squares[row + inc][column];

      if (!oneSpaceForward.occupiedPiece) {
        oneSpaceForward.canBeMovedTo = true;

        // Also allow moving two spaces when we're on the starting block and nothing blocking
        if (
          (color === "black" && initialSquare.rowNumber === 7) ||
          (color === "white" && initialSquare.rowNumber === 2)
        ) {
          const twoSpacesForward = squares[row + inc * 2][column];
          if (!twoSpacesForward.occupiedPiece) {
            twoSpacesForward.canBeMovedTo = true;
          }
        }
      }

      if (isValidSquare(row + inc, column + 1)) {
        const oneSpaceDiagA = squares[row + inc][column + 1];
        if (
          oneSpaceDiagA?.occupiedPiece &&
          oneSpaceDiagA.occupiedPiece.color !== color
        ) {
          oneSpaceDiagA!.canBeMovedTo = true;
        }
      }

      if (isValidSquare(row + inc, column - 1)) {
        const oneSpaceDiagB = squares[row + inc][column - 1];
        if (
          oneSpaceDiagB?.occupiedPiece &&
          oneSpaceDiagB.occupiedPiece.color !== color
        ) {
          oneSpaceDiagB!.canBeMovedTo = true;
        }
      }
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

      allMoves.forEach((arr) => {
        let [rowA, colA] = arr;
        let targetRow = row + rowA;
        let targetCol = column + colA;
        if (isValidSquare(targetRow, targetCol)) {
          let square = squares[targetRow][targetCol];
          if (!square.occupiedPiece || square.occupiedPiece.color !== color) {
            square.canBeMovedTo = true;
          }
        }
      });
    } // Bishop
    else if (piece.name === ChessPiece.Bishop) {
      const directions = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      calculateValidMovesFromArray(squares, directions, initialSquare, color);
    } // Rook
    else if (piece.name === ChessPiece.Rook) {
      const directions = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ];
      calculateValidMovesFromArray(squares, directions, initialSquare, color);
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
      calculateValidMovesFromArray(squares, directions, initialSquare, color);
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
      calculateValidMovesFromArray(squares, directions, initialSquare, color);
    }
  }

  function trySelectSquare(
    squares: ISquareCoreProps[][],
    squareClicked: ISquareCoreProps,
    isWhitesTurn: boolean
  ): boolean {
    if (squareClicked.occupiedPiece) {
      if (
        (whiteTurn && squareClicked.occupiedPiece.color === "white") ||
        (!whiteTurn && squareClicked.occupiedPiece.color === "black")
      ) {
        selectSquare(squares, squareClicked);
        return true;
      }
    }
    return false;
  }

  function selectSquare(
    squares: ISquareCoreProps[][],
    squareClicked: ISquareCoreProps
  ) {
    // deselect currently selected square
    deselectSelectedSquare(squares);

    const { row, column, success } = getRowAndColumnFromPiece(squareClicked);

    if (success) {
      // Set current square as selected
      squares[row][column].selected = true;

      // Identify squares that can be moved to
      const newSelection = squares[row][column];
      identifySquaresToMoveTo(squares, newSelection);
    }
  }

  function moveToSquare(
    squares: ISquareCoreProps[][],
    targetSquare: ISquareCoreProps,
    movingSquare: ISquareCoreProps
  ) {
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

    const pieceCopy: IChessPiece = {
      piece: movingSquare.occupiedPiece.piece,
      color: movingSquare.occupiedPiece.color,
    };

    if (success && success2) {
      squares.map((row) => row.map((val) => (val.canBeMovedTo = false)));
      squares[targetRow][targetCol].occupiedPiece = pieceCopy;
      squares[targetRow][targetCol].selected = false;
      squares[movingRow][movingCol].occupiedPiece = undefined;
      squares[movingRow][movingCol].selected = false;
    }
  }

  function clickHandler(boardSpot: string) {
    if (boardSpot.length !== 2) {
      console.log(`Board spot should be two characters: ${boardSpot}`);
      return;
    }

    let { row, column } = getColumnAndRowFromBoardSpot(boardSpot) || {};
    if (row === undefined || column === undefined) {
      console.log("Couldn't determine board location.");
      return;
    }

    const currentSquares = fenTranslation.squares.slice();
    const squareClicked = currentSquares[row][column];
    const selectedSquare = getSelectedSquare(currentSquares);
    const squareClickedPiece = squareClicked.occupiedPiece;

    // Check if we have a selected square first
    if (selectedSquare) {
      if (
        // If we are clicking on the same square, deselect it and be done
        selectedSquare.rowNumber === squareClicked.rowNumber &&
        selectedSquare.columnName === squareClicked.columnName
      ) {
        deselectSelectedSquare(currentSquares);
        setSquares(currentSquares);
        return;
      } else if (squareClicked.canBeMovedTo) {
        moveToSquare(currentSquares, squareClicked, selectedSquare);
        setSquares(currentSquares);
        let newFen = translateSquaresToFen(currentSquares);
        newFen += ` ${whiteTurn ? "b" : "w"}`;

        // Todo: castling rights
        newFen += ` ${castlingRights}`;

        // Todo: en passant targets
        newFen += ` ${enPassantTarget}`;

        // Todo halfmove clock
        // Moves since last pawn advance or piece capture
        newFen += ` ${(halfmoveClock || 0) + 1}`;

        // This number is incremented by one every time Black moves
        const inc = whiteTurn ? 0 : 1;
        newFen += ` ${(fullmoveNumber || 0) + inc}`;

        doNewMove(newFen);
        return;
      } else if (!squareClickedPiece) {
        // Can't move to this square, nothing is there, so deselect
        deselectSelectedSquare(currentSquares);
        setSquares(currentSquares);
        return;
      } else if (trySelectSquare(currentSquares, squareClicked, whiteTurn)) {
        setSquares(currentSquares);
      }
    } else {
      // We do not have a selected square, select if the right color
      if (trySelectSquare(currentSquares, squareClicked, whiteTurn)) {
        setSquares(currentSquares);
      }
    }
  }

  // Game management via FEN
  const [currentPointInHistory, setCurrentPointInHistory] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<string[]>([props.startingFen]);
  const current = gameHistory[currentPointInHistory];
  const fenTranslation = useMemo(
    () => translateFenToSquaresArray(current),
    [current]
  );
  const {
    activeColor,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
  } = fenTranslation;
  const whiteTurn = activeColor === "white";

  // The actual squares to be displayed on the board
  const [squares, setSquares] = useState<ISquareCoreProps[][]>(
    fenTranslation.squares
  );

  return (
    <>
      <Board squares={squares} onClick={(spot: string) => clickHandler(spot)} />
      <div className="_infoBox">
        <p>It's {activeColor}'s turn.</p>
        <p>Castling rights are {castlingRights}.</p>
        <p>En passant target: {enPassantTarget}.</p>
        <p>Halfmove clock: {halfmoveClock}</p>
        <p>Fullmove number: {fullmoveNumber}</p>
      </div>
      <div style={{ display: "block" }}>
        {gameHistory.map((h, i) => (
          <p key={`gameHistory${i}`}>{h}</p>
        ))}
      </div>
    </>
  );
}
