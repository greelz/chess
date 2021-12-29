import React from "react";
//import logo from "./logo.svg";
import "./App.css";
import Game from "./Game";

function App() {
  return (
    <>
      <div className="_container">
        <Game startingFen="rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d5 1 2" />
      </div>
    </>
  );
}

export default App;
