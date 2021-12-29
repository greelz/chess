import Board from "./Board";
import { useState, useMemo } from "react";
import {
  calculateNewCastleRights,
  deepCopyFunction,
  doEverything,
  getBoardSpotFromPiece,
  getColumnAndRowFromBoardSpot,
  getRowAndColumnFromPiece,
  getSelectedSquare,
  translateSquaresToFen,
} from "./Helpers";
import { ISquareCoreProps } from "./Square";
import { ChessPiece, IChessPiece } from "./Interfaces";

interface IGameProps {
  startingFen: string;
}

export default function Game(props: IGameProps): JSX.Element {
  const doNewMove = (newFen: string) => {
    setGameHistory((prev) => [...prev, newFen]);
    const len = gameHistory.length;
    setCurrentPointInHistory(len);
  };

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

  function trySelectSquare(
    squares: ISquareCoreProps[][],
    squareClicked: ISquareCoreProps,
    isWhitesTurn: boolean
  ): boolean {
    if (squareClicked.occupiedPiece) {
      if (
        (isWhitesTurn && squareClicked.occupiedPiece.color === "white") ||
        (!isWhitesTurn && squareClicked.occupiedPiece.color === "black")
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

      // Highlight the possible move targets
      if (allPossibleMoves) {
        const possibleMovesTargets = allPossibleMoves.allMoves.get(
          getBoardSpotFromPiece(squareClicked)
        );
        possibleMovesTargets?.forEach((boardSpot) => {
          let { row, column } = getColumnAndRowFromBoardSpot(boardSpot);
          squares[row][column].canBeMovedTo = true;
        });
      }
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

    const pieceCopy: IChessPiece = deepCopyFunction(movingSquare.occupiedPiece);

    // Help with castling if we're doing it
    if (movingSquare.occupiedPiece.piece.name === ChessPiece.King) {
      if (Math.abs(movingCol - targetCol) === 2) {
        // We need to also move the rook to the square next to the king
        let rookColumn = 0, castlingLong = true;
        if (targetCol === 6) {
          rookColumn = 7;
          castlingLong = false;
        }

        const rookPiece: IChessPiece = deepCopyFunction(
          squares[movingRow][rookColumn].occupiedPiece
        );
        const columnToMoveTo = Math.abs(castlingLong ? 3 : 2 - rookColumn);
        squares[movingRow][columnToMoveTo].occupiedPiece = rookPiece;
        squares[movingRow][rookColumn].occupiedPiece = undefined;
      }
    }

    if (success && success2) {
      squares.map((row) => row.map((val) => (val.canBeMovedTo = false)));
      squares[targetRow][targetCol].occupiedPiece = pieceCopy;
      squares[targetRow][targetCol].selected = false;
        squares[movingRow][movingCol].occupiedPiece = undefined;
        squares[movingRow][movingCol].selected = false;
    }
  }

  function clickHandler(boardSpot: string) {
    if (isCheckmate) return;
    if (boardSpot.length !== 2) {
      console.error(`Board spot should be two characters: ${boardSpot}`);
      return;
    }

    let { row, column } = getColumnAndRowFromBoardSpot(boardSpot) || {};
    if (row === undefined || column === undefined) {
      console.error("Couldn't determine board location.");
      return;
    }

    const currentSquaresForUI: ISquareCoreProps[][] = deepCopyFunction(squares);
    const squareClicked = currentSquaresForUI[row][column];
    const selectedSquare = getSelectedSquare(currentSquaresForUI);
    const squareClickedPiece = squareClicked.occupiedPiece;

    // Check if we have a selected square first
    if (selectedSquare && allPossibleMoves) {
      const movesThatCanBeMade = allPossibleMoves.allMoves.get(
        getBoardSpotFromPiece(selectedSquare)
      );
      if (
        // If we are clicking on the same square, deselect it and be done
        selectedSquare.rowNumber === squareClicked.rowNumber &&
        selectedSquare.columnName === squareClicked.columnName
      ) {
        deselectSelectedSquare(currentSquaresForUI);
        setSquares(currentSquaresForUI);
        return;
      } else if (movesThatCanBeMade?.includes(boardSpot)) {
        // Before doing the move, need to know what's actually happening

        // Determine enPassant
        const nameOfPieceThatIsMoving =
          selectedSquare.occupiedPiece?.piece.name;

        let newEnPassantString = "-";
        if (nameOfPieceThatIsMoving === ChessPiece.Pawn) {
          if (squareClicked.columnName === selectedSquare.columnName) {
            if (
              Math.abs(squareClicked.rowNumber - selectedSquare.rowNumber) === 2
            ) {
              newEnPassantString =
                selectedSquare.columnName.toLowerCase() +
                (squareClicked.rowNumber + selectedSquare.rowNumber) / 2;
            }
          }
        }

        // Next turn (either b or w)
        const nextTurn = isWhitesTurn ? "b" : "w";

        // Castle rights
        // They stay the same unless a king or rook moved
        // KQkq is original castling rights
        let castleRights = castlingRights;
        castleRights = calculateNewCastleRights(castlingRights, nameOfPieceThatIsMoving, castleRights, isWhitesTurn, selectedSquare);

        // Moves since last pawn advance or piece capture
        let newHalfmoveClock = (halfmoveClock || 0) + 1;
        const isCapture = (
          square1: ISquareCoreProps,
          square2: ISquareCoreProps
        ): boolean => {
          return (
            square1.occupiedPiece !== undefined &&
            square2.occupiedPiece !== undefined
          );
        };

        if (
          nameOfPieceThatIsMoving === ChessPiece.Pawn ||
          isCapture(selectedSquare, squareClicked)
        ) {
          newHalfmoveClock = 0;
        }

        // Fullmove number
        const inc = isWhitesTurn ? 0 : 1;
        const newFullMoveNumber = fullmoveNumber || 0 + inc;

        // Perform the move to update the UI
        moveToSquare(currentSquaresForUI, squareClicked, selectedSquare);
        setSquares(currentSquaresForUI);

        let newFen = `${translateSquaresToFen(
          currentSquaresForUI
        )} ${nextTurn} ${castleRights} ${newEnPassantString} ${newHalfmoveClock} ${newFullMoveNumber}`;

        doNewMove(newFen);
        return;
      } else if (!squareClickedPiece) {
        // Can't move to this square, nothing is there, so deselect
        deselectSelectedSquare(currentSquaresForUI);
        setSquares(currentSquaresForUI);
        return;
      } else if (
        trySelectSquare(currentSquaresForUI, squareClicked, isWhitesTurn)
      ) {
        setSquares(currentSquaresForUI);
      }
    } else {
      // We do not have a selected square, select if the right color
      if (trySelectSquare(currentSquaresForUI, squareClicked, isWhitesTurn)) {
        setSquares(currentSquaresForUI);
      }
    }
  }

  // Game management via FEN
  const [currentPointInHistory, setCurrentPointInHistory] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<string[]>([props.startingFen]);
  const current = gameHistory[currentPointInHistory];
  const fenTranslation = useMemo(() => doEverything(current), [current]);
  const {
    activeColor,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    isInCheck,
    allPossibleMoves,
  } = fenTranslation;

  const isWhitesTurn = activeColor === "white";

  // The actual squares to be displayed on the board, starting with fen translation
  // This needs to be updated outside of fen because fen doesn't have UI concepts like
  // selected square, possible moves, check, etc
  const [squares, setSquares] = useState<ISquareCoreProps[][]>(
    fenTranslation.squares
  );

  const isCheckmate = isInCheck && allPossibleMoves?.possibleMoves === 0;

  return (
    <>
      { isCheckmate ? <div className="_checkmate">Checkmate! {isWhitesTurn ? "Black" : "White"} wins!</div> : null }
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
