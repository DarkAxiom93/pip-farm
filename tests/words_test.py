# The language game: listen to unlock guesses, guess in the tab or right over a pip, pips that teach you, levels.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sound":True})
        d["lex"]={"בלופ":{"c":"food","ok":False,"heard":0},"זומי":{"c":"sleep","ok":False,"heard":3},"טיקו":{"c":"play","ok":False,"heard":6}}
        for i,pp in enumerate(d["pips"]): pp["lang"]={"food":"בלופ","sleep":"זומי","play":"טיקו"};pp["trust"]=40
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        await pg.evaluate("__pip.setTab('lang')");await pg.wait_for_timeout(300)
        n0=await pg.locator(".lexi[data-w='בלופ'] [data-wguess]").count();n3=await pg.locator(".lexi[data-w='זומי'] [data-wguess]").count();n6=await pg.locator(".lexi[data-w='טיקו'] [data-wguess]").count()
        print("CHOICES by listening",n0,n3,n6)
        print("LEVEL",await pg.locator(".langlvl b").inner_text())
        await pg.locator(".lexi[data-w='זומי'] [data-wguess='sleep']").click();await pg.wait_for_timeout(300)
        print("TAB guess right",await pg.evaluate("__pip.S.lex['זומי'].ok"))
        # wrong guess -> wait
        bad=await pg.evaluate("Object.keys({food:1,sleep:1,love:1,play:1,fear:1,day:1,night:1,keeper:1,friend:1,water:1,work:1})")
        btns=await pg.locator(".lexi[data-w='טיקו'] [data-wguess]").evaluate_all("els=>els.map(e=>e.dataset.wguess)")
        wrong=[c for c in btns if c!="play"][0];await pg.locator(f".lexi[data-w='טיקו'] [data-wguess='{wrong}']").click();await pg.wait_for_timeout(200)
        print("TAB guess wrong",await pg.evaluate("__pip.S.lex['טיקו'].ok")==False)
        # in the world: a pip says a word, the bubble asks, tap the pip and guess
        await pg.evaluate("__pip.setTab('pip')");await pg.evaluate("__pip.S.lex['בלופ'].heard=2")
        for i in range(6):
            await pg.evaluate("(()=>{const P=__pip,p=P.S.pips[3];p.x=150;p.y=110;p.question=null;const r=P.rt(p);r.state='idle';r.need=null;P.S.pips.forEach(q=>P.clearBubble(q.id));P.langSpeak(p,'food',1)})()");await pg.wait_for_timeout(200)
            if await pg.locator(".bub.ask").count(): break
        print("BUBBLE asks",await pg.locator(".bub.ask").count()>0)
        await tapw(pg,150,106);await pg.wait_for_timeout(300)
        print("POPUP choices",await pg.locator("#pmenu [data-wguess]").count())
        await pg.locator("#pmenu [data-wguess='food']").click();await pg.wait_for_timeout(300)
        print("WORLD guess right",await pg.evaluate("__pip.S.lex['בלופ'].ok"))
        # a pip that loves you teaches the word
        await pg.evaluate("(()=>{const P=__pip;P.S.lex['טיקו'].heard=6;const p=P.S.pips[4];p.trust=90;const r=P.rt(p);r.state='idle';const mr=Math.random;Math.random=()=>0.01;try{P.langSpeak(p,'play',1)}finally{Math.random=mr}})()")
        await pg.wait_for_timeout(1500);print("TAUGHT",await pg.evaluate("__pip.S.lex['טיקו'].ok"),"counted",await pg.evaluate("__pip.S.stats.taught"))
        print("LEVEL after",await pg.evaluate("__pip.langLevel().name"))
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
