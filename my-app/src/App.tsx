import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Board from "./Board";

function App() {
  return (
    <div className="_container">
      <div className="_chessBoard">
        <Board fenNotation="rrrrrrr" />
        <Board fenNotation="rQrrrrr" />
        <Board fenNotation="rnnnnrr" />
        <Board fenNotation="pppprrr" />
        <Board fenNotation="rrr   rrrr" />
        <Board fenNotation="r i  sdf isaf jaslf aewsi fjasjelfasd flksadjf alksrrrrrr" />
      </div>
    </div>
  );
}

export default App;
