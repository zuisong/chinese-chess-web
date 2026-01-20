import type { Component } from "solid-js";
import Game from "./components/Game";
import UI from "./components/UI";

const App: Component = () => {
  return (
    <div class="w-screen h-screen flex flex-row justify-center items-center content-center bg-[#333] flex-wrap overflow-hidden p-2.5 gap-5 box-border">
      <div class="w-full max-w-[521px] aspect-[521/577] shrink-0 max-h-[60vh]">
        <Game />
      </div>
      <div class="w-full max-w-[521px] h-auto flex flex-col flex-[1_1_300px] overflow-hidden max-h-[35vh]">
        <UI />
      </div>
    </div>
  );
};

export default App;
