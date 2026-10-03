# Night: dreams to peek into, fireflies that fill a jar and light lanterns, drawing a constellation.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sound":True})
        d["lex"]={"בלופ":{"c":"food","ok":False}}
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=23,minute=30));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(2000);await pg.mouse.click(5,5)
        # dreams
        await pg.evaluate("__pip.S.pips.forEach((p,i)=>{const r=__pip.rt(p);r.state='sleep';r.nap=false;p.lang={food:'בלופ'};p.x=110+i*8;p.y=90})");await pg.wait_for_timeout(200)
        for i in range(8):
            await pg.evaluate("__pip.dreamTick(999)");await pg.wait_for_timeout(400)
            if await pg.evaluate("__pip.S.pips.some(q=>__pip.rt(q).dream)"): break
        who=await pg.evaluate("(()=>{const p=__pip.S.pips.find(q=>__pip.rt(q).dream);return p?{x:p.x,y:p.y}:null})()")
        print("DREAM shown",bool(who),"bubble",await pg.locator(".bub.dream canvas").count()>0)
        if who: await tapw(pg,who["x"],who["y"]-4);await pg.wait_for_timeout(1500)
        title=await pg.locator("#sTitle").inner_text();print("DREAM peek","החלום של" in title)
        await pg.wait_for_timeout(2500);print("DREAM decoded word",await pg.evaluate("__pip.S.lex['בלופ'].ok"),"counted",await pg.evaluate("__pip.S.stats.dreams"))
        await pg.evaluate("document.getElementById('story').hidden=true")
        # fireflies -> lantern
        sp=await pg.evaluate("__pip.S.sparks")
        for i in range(10): await pg.evaluate("(()=>{const f=__pip.flies[0];__pip.catchFlyAt(f.x,f.y)})()")
        r=await pg.evaluate("({jar:__pip.S.jar,l:__pip.S.lanterns,sp:__pip.S.sparks})");print("FLIES jar",r["jar"],"lanterns",r["l"],"paid",r["sp"]-sp>=15)
        # a tap on a firefly on screen catches it too
        f=await pg.evaluate("(()=>{const c=__pip.cam,v=__pip.flies.find(f=>f.x>c.x+20&&f.x<c.x+230&&f.y>c.y+20&&f.y<c.y+150);return v?[v.x,v.y]:null})()")
        if f: await tapw(pg,f[0],f[1]);await pg.wait_for_timeout(200)
        print("FLIES tap",await pg.evaluate("__pip.S.jar")==1 if f else True)
        # constellation
        await pg.locator("#hStars").click();print("STARS mode",await pg.evaluate("__pip.starMode"))
        box=await pg.locator("#cv").bounding_box()
        for i in [0,1,2]:
            s=await pg.evaluate(f"__pip.SKY[{i}]");await pg.mouse.click(box["x"]+s["fx"]*box["width"]+1,box["y"]+s["fy"]*box["height"]+1);await pg.wait_for_timeout(150)
        await pg.locator("#hStars").click();await pg.wait_for_timeout(300)
        c=await pg.evaluate("__pip.S.constellations");print("STARS saved",len(c),"lines",len(c[0]["lines"]) if c else 0)
        await pg.wait_for_timeout(2500);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED night",s.get("lanterns"),len(s.get("constellations",[])))
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"night.png"))
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
