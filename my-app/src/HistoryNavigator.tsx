import { ReactComponent as Analysis } from "./images/chart-area-solid.svg";
import { ReactComponent as FirstMove } from "./images/fast-backward-solid.svg";
import { ReactComponent as LastMove } from "./images/fast-forward-solid.svg";
import { ReactComponent as GoBack } from "./images/step-backward-solid.svg";
import { ReactComponent as GoForward } from "./images/step-forward-solid.svg";
import { ReactComponent as Flip } from "./images/socks-solid.svg";
import { useEffect, useRef } from "react";

interface IHistoryNavigatorProps {
  opponentName: string;
  myName: string;
  moveList: string[];
  currentPosition: number;
  goForward: () => void;
  goBack: () => void;
  goBackToBeginning: () => void;
  goToEnd: () => void;
  jumpToPosition: (pos: number) => void;
}

export default function HistoryNavigator(
  props: IHistoryNavigatorProps
): JSX.Element {
  let moveListContent: JSX.Element[] = [];
  for (let i = 0; i < props.moveList.length; i += 2) {
    moveListContent.push(
      <div className="_moveRow">
        <div className="_moveNumber">{i / 2 + 1}.</div>
        <div
          onClick={() => props.jumpToPosition(i)}
          className={`_move ${
            props.currentPosition === i + 1 ? "_selected" : ""
          }`}
        >
          {props.moveList[i]}
        </div>
        <div
          onClick={() => props.jumpToPosition(i + 1)}
          className={`_move ${
            props.currentPosition === i + 2 ? "_selected" : ""
          }`}
        >
          {props.moveList[i + 1]}
        </div>
      </div>
    );
  }

  const moveListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.currentPosition && moveListRef.current) {
      const rowToScrollTo: HTMLDivElement =
        moveListRef.current.getElementsByClassName("_move")[
          props.currentPosition
        ] as HTMLDivElement;
      if (rowToScrollTo) {
        moveListRef.current.scrollTo(0, rowToScrollTo.offsetTop + 20);
      }
    }
  }, [props.currentPosition]);

  return (
    <div className="_historyNavigator">
      <div className="_name">{props.opponentName}</div>
      <div className="_historyContainer">
        <div className="_historyButton">
          <Flip />
        </div>
        <div className="_historyButton">
          <FirstMove onClick={props.goBackToBeginning} />
        </div>
        <div className="_historyButton">
          <GoBack onClick={props.goBack} />
        </div>
        <div className="_historyButton">
          <GoForward onClick={props.goForward} />
        </div>
        <div className="_historyButton">
          <LastMove onClick={props.goToEnd} />
        </div>
        <div className="_historyButton">
          <Analysis />
        </div>
      </div>
      <div ref={moveListRef} className="_moveList">
        {moveListContent}
      </div>
      <div className="_gameProposalContainer">
        <div className="_gameProposal takeback"></div>
        <div className="_gameProposal draw"></div>
        <div className="_gameProposal resign"></div>
      </div>
      <div className="_name">{props.myName}</div>
    </div>
  );
}
