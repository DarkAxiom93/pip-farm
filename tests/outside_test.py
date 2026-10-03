# Letters, the late-night note, the window title glitch and greeting the keeper.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=4,frag=5,choices=["wave","game"],kind=2))
        pg=await b.new_page(viewport={"width":1280,"height":800})
        pg.on("pageerror",lambda e:errs.append(str(e)))
        # pretend it is 02:30 at night
        t=datetime.datetime.now().replace(hour=2,minute=30,second=0,microsecond=0)
        await pg.clock.install(time=t)
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.clock.run_for(2000)
        # late night: pips send the keeper to bed and write the "sleep" letter
        await pg.mouse.click(5,5);await pg.evaluate("__pip.outsideTick(999)");await pg.clock.run_for(5000)
        st=await pg.evaluate("({late:__pip.S.lateNote,letters:Object.keys(__pip.S.letters||{})})")
        print("LATE note set",bool(st["late"]),"letters",st["letters"])
        await pg.evaluate("__pip.outsideTick(999)");print("LATE once per night",await pg.evaluate("Object.keys(__pip.S.letters).length"))
        # a letter can only arrive once
        await pg.evaluate("__pip.letter('wall');__pip.letter('wall')");print("LETTER wall once",await pg.evaluate("Object.keys(__pip.S.letters).filter(k=>k==='wall').length"))
        lines=await pg.evaluate("__pip.S.letters.wall.lines");print("LETTER wall lines",len(lines),"signed",lines[-1])
        # journal lists the letters and opens one
        await pg.clock.run_for(5000);await pg.evaluate("document.getElementById('story').hidden=true");await pg.evaluate("__pip.openJournal()")
        print("JOURNAL letters",await pg.locator("#sLines li[data-l]").count())
        await pg.locator("#sLines li[data-l='wall']").click();await pg.clock.run_for(3000)
        print("JOURNAL open letter",await pg.locator("#sTitle").inner_text())
        await pg.evaluate("document.getElementById('story').hidden=true")
        # title glitch in chapter 4 (needs focus; force it)
        await pg.evaluate("document.hasFocus=()=>true;__pip.titleTick(99999)");titles=set()
        for _ in range(5): await pg.clock.run_for(900);titles.add(await pg.title())
        print("TITLE glitched","אנחנו רואים אותך" in titles,"back to normal",await pg.title())
        # the keeper comes back after an hour
        await pg.evaluate("__pip.keeperBack(65)");await pg.clock.run_for(1500)
        print("BACK greeted",await pg.locator(".bub").count()>0)
        # endings write their letter
        await pg.evaluate("__pip.S.story.site={k:'gate',p:100,x:244,y:163};__pip.ending('together')");await pg.clock.run_for(16000)
        print("ENDING letter",await pg.evaluate("!!__pip.S.letters.together"))
        st=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')") or "{}")
        await pg.clock.run_for(5000);st=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED letters",sorted(st.get("letters",{}).keys()))
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
