# Shared moments: recorded, remembered, remembered together, anniversaries, reset and New Game+.
import asyncio,json,time
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sound":True})
        pg=await page(b,d,errs,"M")
        await pg.mouse.click(5,5)
        # petting the first time records a moment
        await pg.evaluate("(()=>{const P=__pip,p=P.S.pips[1];P.rt(p).state='idle';})()")
        x,y=await pg.evaluate("[__pip.S.pips[1].x,__pip.S.pips[1].y]")
        await pg.evaluate("(()=>{const P=__pip,p=P.S.pips[1];P.rt(p).petCd=0;P.pet(p)})()")
        print("PET moment",await pg.evaluate("(__pip.S.moments||[]).filter(m=>m.k==='pet').length"))
        # an old moment gets remembered by a pip that was there
        await pg.evaluate("(()=>{const P=__pip,m=P.moment('choir',P.S.pips.slice(0,12));m.t=Date.now()-2*86400000;P.S.moments.filter(x=>x.k==='pet').forEach(x=>x.t=Date.now()-5*60000);P.S.pips.forEach(p=>{const r=P.rt(p);r.state='idle';r.need=null;p.x=120+Math.random()*60;p.y=60+Math.random()*30})})()")
        await pg.wait_for_timeout(400);await pg.mouse.move(600,300);await pg.evaluate("__pip.recallTick(99999)");await pg.wait_for_timeout(500)
        who=await pg.evaluate("(()=>{const P=__pip;const p=P.S.pips.find(q=>P.rt(q).recall);return p?{id:p.id,x:p.x,y:p.y}:null})()")
        print("RECALL started",bool(who),"memo bubble",await pg.locator(".bub.memo canvas.doodle").count()>0)
        if who:
            await tapw(pg,who["x"],who["y"]-4);await pg.wait_for_timeout(500)
            st=await pg.evaluate("(()=>{const P=__pip,m=P.S.moments.find(x=>x.k==='choir');return {shared:m.shared,draw:P.S.drawings.length}})()")
            print("SHARED together",st["shared"],"drawing",st["draw"]>0)
        # anniversary: a week ago today
        await pg.evaluate("(()=>{const P=__pip,m=P.moment('streak',null,7,false);m.t=Date.now()-7*86400000;P.anniversaries()})()")
        print("ANNIV",await pg.evaluate("__pip.S.moments.find(x=>x.k==='streak').anniv"))
        # the album shows the book of moments, the pip panel shows its own moments
        await pg.evaluate("__pip.setTab('album')");await pg.wait_for_timeout(300)
        print("ALBUM book",await pg.locator("#albBody h3",has_text="ספר הרגעים").count())
        await pg.evaluate("__pip.setTab('pip')");await pg.wait_for_timeout(300)
        print("PANEL moments",await pg.locator("#momList li").count()>0)
        # saved
        await pg.wait_for_timeout(2500);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED moments",len(s.get("moments",[]))>=3,"n",len(s.get("moments",[])),"live",await pg.evaluate("__pip.S.moments.length"))
        # reset ending forgets them; New Game+ keeps pip_001's own moments as old ones
        await pg.evaluate("__pip.S.story.site={k:'gate',p:100,x:244,y:163};__pip.S.story.ch=5;__pip.storyChoose('reset')");await pg.wait_for_timeout(500)
        print("RESET forgot",await pg.evaluate("__pip.S.moments.length"))
        await pg.evaluate("(()=>{const P=__pip;P.S.sparks=500;P.storyChoose('restore')})()");await pg.wait_for_timeout(300)
        print("RESTORE back",await pg.evaluate("__pip.S.moments.length>=3"))
        await pg.evaluate("(()=>{const P=__pip;P.S.story.ending='free';P.newGamePlus()})()");await pg.wait_for_timeout(800)
        r=await pg.evaluate("({n:__pip.S.moments.length,old:__pip.S.moments.every(m=>m.old),who:__pip.S.moments.every(m=>m.who[0]===__pip.S.pips[0].id)})")
        print("NG kept",r["n"]>0,"old",r["old"],"founder",r["who"])
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
