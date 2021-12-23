import React, { useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import Game from "./Game";

function App() {
  return (
    <>
      <div className="_container">
        <Game startingFen="rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2" />
      </div>
    </>
  );
}

export default App;
