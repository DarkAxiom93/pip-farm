# The world reacts: bugs, fish, the pond and its frog, digging, singing flowers, the collection book.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sound":True,"zones":{"meadow":1}})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(2000);await pg.mouse.click(5,5)
        # move pips out of the way so taps reach the world
        await pg.evaluate("__pip.S.pips.forEach(p=>{p.x=235;p.y=20;const r=__pip.rt(p);r.state='sleep';r.nap=true})")
        # bugs appear and can be caught
        for i in range(6): await pg.evaluate("__pip.natureTick(20)")
        print("BUGS spawned",await pg.evaluate("__pip.critters.length")>0)
        c=await pg.evaluate("(()=>{const L=__pip.critters;L.forEach((c,i)=>{c.fly=false;c.vx=0;c.vy=0;c.x=100+i*14;c.y=150;c.sp=__pip.SPECIES.find(s=>s.id==='beetle')});return L.map(c=>({x:c.x,y:c.y,id:c.sp.id}))})()")
        if c: await tapw(pg,c[0]["x"],c[0]["y"]);await pg.wait_for_timeout(300)
        print("BUG caught",await pg.evaluate(f"!!(__pip.S.col||{{}})['{c[0]['id']}']") if c else False)
        # digging
        await pg.evaluate("__pip.S.digs=[{x:120,y:100,z:'farm'}]");await tapw(pg,120,99);await pg.wait_for_timeout(700)
        col=await pg.evaluate("Object.keys(__pip.S.col)");print("DIG found",len(col)>=2,"spot gone",await pg.evaluate("__pip.S.digs.length")==0)
        # the pond: ripples, and sooner or later a frog
        frog=False
        for i in range(25):
            await tapw(pg,34,141);await pg.wait_for_timeout(250)
            if await pg.evaluate("!!__pip.S.col.frog"): frog=True;break
            await pg.wait_for_timeout(2000)
        print("POND frog",frog,"ripples seen",await pg.evaluate("__pip.ripples.length"))
        # flowers: eight taps play the song
        await pg.evaluate("__pip.critters.length=0;__pip.fishes.length=0;__pip.S.digs=[]")
        f=await pg.evaluate("__pip.FLOWERS[0]")
        for i in range(8): await pg.evaluate("__pip.critters.length=0");await tapw(pg,f["x"],f["y"]-6);await pg.wait_for_timeout(120)
        print("FLOWERS song",await pg.evaluate("__pip.S.stats.songs||0"))
        # the book in the album
        await pg.evaluate("__pip.setTab('album')");await pg.wait_for_timeout(300)
        print("BOOK shown",await pg.locator("#albBody h3",has_text="ספר האוסף").count(),"items",await pg.locator(".colitem").count()==await pg.evaluate("__pip.SPECIES.length"))
        await pg.wait_for_timeout(2500);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED col",len(s.get("col",{}))>=3)
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
