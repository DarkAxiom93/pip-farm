# Bug hunting: glitch bugs appear once the farm is digital, steal bits, get caught by tap or by pips with legs.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=0),{"sound":False,"basket":20,"bin":[20,0,0]})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        await pg.evaluate("__pip.bugT=0");await pg.wait_for_timeout(500)
        print("BUGS before digital",await pg.evaluate("__pip.bugs.length"))
        await pg.evaluate("__pip.S.story.ch=2;__pip.bugT=0");await pg.wait_for_timeout(500)
        print("BUGS spawn",await pg.evaluate("__pip.bugs.length")>=1)
        # stealing
        bk=await pg.evaluate("__pip.S.basket");await pg.evaluate("__pip.bugs[0].steal=0");await pg.wait_for_timeout(300)
        print("STEAL",bk-await pg.evaluate("__pip.S.basket"),"loot",await pg.evaluate("__pip.bugs[0].loot"))
        # tap to catch: freeze it first
        await pg.evaluate("(()=>{const b=__pip.bugs[0];b.x=200;b.y=60;b.hop=99;__pip.S.pips.forEach(p=>{p.x=60;p.y=200})})()");bk=await pg.evaluate("__pip.S.basket")
        await tapw(pg,200,59);await pg.wait_for_timeout(300)
        print("CATCH tap",await pg.evaluate("__pip.bugs.length")==0,"back",await pg.evaluate("__pip.S.basket")-bk,"book",await pg.evaluate("Object.keys(__pip.S.col).some(k=>['bytebug','pointer','nullmoth','loopworm','panic'].includes(k))"))
        # a pip with legs chases one
        await pg.evaluate("__pip.bugT=0");await pg.wait_for_timeout(400)
        await pg.evaluate("(()=>{const b=__pip.bugs[0],p=__pip.S.pips[2],r=__pip.rt(p);b.hop=99;b.life=99;p.ds=2;p.dmod=0;p.x=b.x+30;p.y=b.y;r.state='idle';r.wait=0;r.job=null;r.goal=null;__pip.chaseBug(p,r)})()")
        await pg.wait_for_function("(__pip.S.stats.bugs||0)>=2",timeout=10000)
        print("CHASE caught",await pg.evaluate("__pip.S.stats.bugs"))
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
