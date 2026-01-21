import type { Component } from "solid-js";
import Game from "./components/Game";
import UI from "./components/UI";

const App: Component = () => {
  return (
    <div class="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-[#333] p-2 sm:p-5 gap-2 sm:gap-5 box-border overflow-x-hidden">
      <div class="w-full max-w-[521px] aspect-[521/577] shrink-0">
        <Game />
      </div>
      <div class="w-full max-w-[521px] flex flex-col">
        <UI />
      </div>
    </div>
  );
};

export default App;
