/* speech: sounds, and now and then one word picked by mood */
function moodOf(p){
  const r=rt(p);
  if(r.state==="sleep"||(night&&r.state!=="work"))return"sleepy";
  if(r.act==="hide")return"scared";
  if(p.food<20)return"hungry";
  if(p.mood<30)return"sad";
  if(r.state==="celebrate"||p.mood>90)return"excited";
  if(p.mood>70)return"happy";
  return Math.random()<.3?"curious":"content";
}
function wordFor(p,m){
  const pos=m==="happy"||m==="excited"||m==="content";
  if(pos&&p.vocab.length&&Math.random()<.6)return pick(p.vocab);
  return pick(MOOD_WORDS[m]||MOOD_WORDS.content);
}
function chatter(p,m?,force?){
  m=m||moodOf(p);
  const lv=level(p),chance=.05+Math.min(lv,10)*.012+(m==="excited"||m==="hungry"?.08:0)+(dom(p)==="talk"?.06:0);
  if(force||Math.random()<chance)say(p,wordFor(p,m)+(m==="curious"?"?":"!"),2.2,"word",m);
  else say(p,pick(SOUNDS[m]),1.6,"snd",m);
}
function localRead(p,text){
  const t=text.toLowerCase();
  if(/אוהב|חמוד|מתוק|יפה|כל הכבוד|אלוף|גאה|love|cute/.test(t))return{mood:Math.random()<.5?"excited":"happy",act:Math.random()<.5?"nuzzle":"hop"};
  if(/טיפש|מכוער|שונא|די|לך|רע|stupid|hate/.test(t))return{mood:Math.random()<.5?"sad":"scared",act:"hide"};
  if(/אוכל|רעב|צנון|דלעת|לאכול|food/.test(t))return{mood:"excited",act:"hop"};
  if(/לישון|לילה|עייף|שינה|sleep/.test(t))return{mood:"sleepy",act:"none"};
  if(/רוקד|לרקוד|שיר|מוזיקה|dance|song/.test(t))return{mood:"excited",act:"dance"};
  if(/\?|מה|למה|איך|מי /.test(t))return{mood:"curious",act:"spin"};
  return{mood:p.mood>60?"happy":"content",act:Math.random()<.4?"hop":"none"};
}
/* the pips' own language */
function newWord(){for(let i=0;i<40;i++){const w=pick(LSYL)+pick(LSYL)+(Math.random()<.2?pick(LSYL):"");if(!S.lex[w]&&w.length<=7)return w}return pick(LSYL)+ri(2,9)}
function speakers(w){let n=0;for(const p of S.pips)for(const c in p.lang)if(p.lang[c]===w)n++;return n}
function langSpeak(p,c,ch){
  if(Math.random()>ch||focusing())return false;
  let w=p.lang[c];
  if(!w){
    const ex=Object.keys(S.lex).filter(k=>S.lex[k].c===c);
    if(ex.length&&Math.random()<.65)w=ex.sort((a,b)=>speakers(b)-speakers(a))[0];
    else if(Object.keys(S.lex).length<44){w=newWord();S.lex[w]={c,ok:false,born:Date.now(),heard:0};toast(`${p.name} המציא מילה חדשה: "${w}"`);SFX.q(p.pitch);setTimeout(renderLangCount,0)}
    else return false;
    p.lang[c]=w;
  }
  if(!S.lex[w])S.lex[w]={c,ok:false,born:Date.now(),heard:0};
  S.lex[w].heard=(S.lex[w].heard||0)+1;S.lex[w].last=Date.now();
  say(p,w,2.4,"lang",(CONCEPT_REACT[c]||["content"])[0]);wordSaid(p,w,c);
  if(tab==="lang")renderLangSoon();
  dirty();return true;
}
function lexIn(text){const t=text.replace(/[^\p{L}\p{N} ]+/gu," ").split(/\s+/);return t.find(w=>S.lex[w])||null}
let lexT=null;function renderLangSoon(){clearTimeout(lexT);lexT=setTimeout(langRefresh,600)}

