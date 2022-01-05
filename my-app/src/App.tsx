import React from "react";
//import logo from "./logo.svg";
import "./App.css";
import Game from "./Game";

function App() {
  return (
    <>
      <Game startingFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq d5 1 2" />
    </>
  );
}

export default App;
