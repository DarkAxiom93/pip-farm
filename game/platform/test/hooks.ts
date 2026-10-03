/* test-only build: lets the browser tests read the camera and state. Never shipped. */
(window as any).__pip={get cam(){return cam},get S(){return S},CW,CH,get AC(){return AC},get master(){return master},MUS,audio,SFX,musicMode,
  get cardOn(){return cardOn},storyChoose,openJournal,setNight(v){night=v},letter,openLetter,outsideTick,titleTick,keeperBack,ending};
