import { Square, ISquareProps } from "./Square";
import { ChessPiece, ChessSVG, IChessPiece } from "./Enums";
import { useState } from "react";
import { truncateSync } from "fs";
import { parse } from "path/posix";
import { isNumericLiteral } from "typescript";

export interface IBoardProps {
  fenNotation: string;
}

interface IFenTranslation {
  squares: ISquareProps[][];
  activeColor: "white" | "black";
  castlingRights: string;
  enPassantTarget: string;
  halfmoveClock: number;
  fullmoveNumber: number;
}

export default function Board(props: IBoardProps): JSX.Element {
  // Returns a specific piece, or null if it isn't a piece (like / or a number)
  function getPieceFromFenChar(elem: string): IChessPiece | undefined {
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

  function pushSafely(
    squares: ISquareProps[][],
    column: number,
    row: number,
    piece?: IChessPiece
  ) {
    // We receive rows/columns 0-indexed, from top (8th rank) to bottom (1st rank)
    // e.g., b7 should be row = 1, col = 1
    if (column > 7 || row > 7) {
      console.log("Trying to add out of bounds.");
      console.log(`Column: ${column}, row: ${row}`);
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

    const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];

    squares[row][column] = {
      color: squareColor,
      columnName: cols[column],
      rowNumber: 8 - row,
      occupiedPiece: piece,
    };
  }

  function translateFenToSquaresArray(f: string): IFenTranslation | undefined {
    f = f.trim();
    let ret: ISquareProps[][] = [];
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
      if (!piece) {
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

    const remain = f.substring(i + 1).split(" ");
    // remain[0] is whoever's turn it is
    // remain[1] is castle-rights
    // remain[2] is en passant target square, or '-'
    // remain[3] is half-move clock
    // remain[4] is full move number

    if (!remain || remain.length !== 5) {
      console.log(
        "Invalid FEN notation sent over, couldn't find extra information."
      );
      return;
    } else {
      const [
        turn,
        castleRights,
        enPassantTarget,
        halfMoveClock,
        fullMoveNumber,
      ] = remain;

      console.log(ret, turn, castleRights);
      if (!isNaN(+halfMoveClock) && !isNaN(+fullMoveNumber)) {
        let halfMoveClockNum = parseInt(halfMoveClock);
        let fullMoveNumberNum = parseInt(halfMoveClock);
        return {
          squares: ret,
          activeColor: turn === "w" ? "white" : "black",
          castlingRights: castleRights,
          enPassantTarget: enPassantTarget,
          halfmoveClock: halfMoveClockNum,
          fullmoveNumber: fullMoveNumberNum,
        };
      } else {
        return;
      }
    }
  }

  const res = translateFenToSquaresArray(props.fenNotation);
  console.log(res);

  if (!res) {
    return <>Nothing to display, something went wrong.</>;
  }
  const {
    squares,
    activeColor,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
  } = res;

  let disp: JSX.Element[][] = [];
  let rowNum = 0;
  if (squares) {
    squares.forEach((row) => {
      disp.push([]);
      row.forEach((square) => {
        disp[rowNum].push(
          <Square
            columnName={square.columnName}
            rowNumber={square.rowNumber}
            color={square.color}
            key={square.columnName + square.rowNumber}
            occupiedPiece={square.occupiedPiece}
          />
        );
      });
      rowNum += 1;
    });
  }

  return (
    <>
      <div className="_chessBoard">
        {disp.map((row, i) => {
          return (
            <div key={"row" + i} className="_boardRow">
              {row}
            </div>
          );
        })}
      </div>
      <div className="_infoBox">
        <p>
          It's {activeColor}'s turn.
        </p>
        <p>
          Castling rights are {castlingRights}.
        </p>
        <p>
          En passant target: {enPassantTarget}.
        </p>
        <p>
          Halfmove clock: {halfmoveClock}
        </p>
        <p>
          Fullmove number: {fullmoveNumber}
        </p>
      </div>
    </>
  );
}
