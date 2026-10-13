# Composer, photo mode, ambassador pips (send / receive a guest) and the timeline.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2),{"sound":True})
        pg=await b.new_page(viewport={"width":1280,"height":800},accept_downloads=True);pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        # composer
        await pg.evaluate("__pip.setTab('farm')");await pg.wait_for_timeout(300)
        print("COMP grid",await pg.locator("#composerBox .cc").count())
        for c,r in [(0,2),(1,4),(2,5),(4,3)]: await pg.locator(f"#composerBox [data-cc='{c}'][data-cr='{r}']").click()
        print("COMP notes",await pg.evaluate("__pip.comp.join(',')"))
        await pg.locator("#composerBox [data-comp='play']").click();await pg.wait_for_timeout(1500)
        print("COMP played",await pg.evaluate("__pip.S.stats.songsPlayed"))
        await pg.locator("#composerBox [data-comp='save']").click();await pg.wait_for_timeout(200)
        print("COMP saved",await pg.evaluate("__pip.S.songs.length"),"in music",await pg.evaluate("(()=>{let k=0;for(let i=0;i<60;i++){const m=__pip.songMotif();if(m&&m.join(',')==='2,4,5,-1,3,-1,-1,-1')k++}return k>3})()"))
        # photo mode
        await pg.locator("#zPhoto").click();print("PHOTO on",await pg.evaluate("__pip.photoOn"),"bar",await pg.locator("#photoBar").is_visible())
        await pg.fill("#photoName","החווה של הבדיקה")
        async with pg.expect_download() as dl: await pg.locator("#photoShoot").click()
        f=await dl.value;print("PHOTO file",f.suggested_filename.endswith(".png"),"preview",await pg.locator("#photoPrev").is_visible(),"name",await pg.evaluate("__pip.S.farmName"))
        await pg.locator("#photoClose").click()
        # ambassador: make a code, receive it as a guest
        code=await pg.evaluate("__pip.pipCode(__pip.S.pips[1])");print("CODE ok",code.startswith("PIP1:"),"reads back",await pg.evaluate(f"__pip.readCode({json.dumps(code)}).n")==await pg.evaluate("__pip.S.pips[1].name"))
        print("BAD code",await pg.evaluate("__pip.readCode('PIP1:zzz')") is None)
        await pg.evaluate("__pip.renderGuests ? 0 : 0");await pg.fill("#guestCode",code);await pg.locator("#guestGo").click();await pg.wait_for_timeout(500)
        g=await pg.evaluate("__pip.S.guests.map(g=>g.n)");print("GUEST arrived",len(g)==1,"listed",await pg.locator("#guestBox li").count())
        await pg.locator("#guestGo").click();await pg.fill("#guestCode",code);await pg.locator("#guestGo").click();print("GUEST no dup",await pg.evaluate("__pip.S.guests.length"))
        gp=await pg.evaluate("(()=>{const g=__pip.S.guests[0];g.tx=g.x=200;g.ty=g.y=120;__pip.S.pips.forEach(p=>{p.x=60;p.y=200});return {x:g.x,y:g.y}})()")
        sp=await pg.evaluate("__pip.S.sparks");await tapw(pg,gp["x"],gp["y"]-5);await pg.wait_for_timeout(300)
        print("GUEST popup",await pg.locator("#pmenu h4").inner_text(),"gift",await pg.evaluate("__pip.S.sparks")-sp)
        # the ambassador button in the pip panel
        await pg.evaluate("__pip.select(__pip.S.pips[0].id)");await pg.locator("#ambBtn").click();await pg.wait_for_timeout(200)
        print("SEND code shown",(await pg.locator("#pmenu textarea").input_value()).startswith("PIP1:"))
        # timeline
        await pg.evaluate("__pip.histTick();__pip.setTab('album')");await pg.wait_for_timeout(300)
        print("TIMELINE",await pg.locator(".mem.tl li").count()>=3,"events",await pg.evaluate("__pip.timelineEvents().some(e=>e.x.includes('שיר'))"))
        await pg.wait_for_timeout(2000);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED songs",len(s.get("songs",[])),"guests",len(s.get("guests",[])),"name",s.get("farmName"),"hist",len(s.get("hist",{}))>=1)
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
