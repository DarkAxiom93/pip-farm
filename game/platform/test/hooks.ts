/* test-only build: lets the browser tests read the camera and state. Never shipped. */
(window as any).__pip={get cam(){return cam},get S(){return S},CW,CH};
