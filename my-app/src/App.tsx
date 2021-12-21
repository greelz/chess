import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Square from "./Square";
import { ChessPiece } from "./Enums";

function App() {
  return (
    <div className="_container">
      <div className="_chessBoard">
        <Square color="light" columnName="A" rowNumber={8} occupiedPiece={ChessPiece.Rook} />
      </div>
    </div>
  );
}

export default App;
