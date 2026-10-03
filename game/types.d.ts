// Things the page gets from outside: the artifact runtime (claude), the desktop shell (pipDesktop), old Safari audio.
interface Window { webkitAudioContext?: typeof AudioContext; claude?: any; pipDesktop?: any }
declare const claude: any;
declare const pipDesktop: any;
