# Pips sing with the music: voices snap to the chord and the beat while it plays, and they hum the tune.
import asyncio,json,datetime,math
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]);errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sound":True})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500)
        await pg.mouse.click(5,5);await pg.evaluate("__pip.audio()");await pg.wait_for_timeout(2500)
        r=await pg.evaluate("(()=>{const P=__pip,out=[];for(const f of [333,523,611,777]){const g=P.snapF(f),s=Math.round(12*Math.log2(g/196));out.push(P.MUS.cur.map(n=>((n%12)+12)%12).includes(((s%12)+12)%12))}return {ok:out.every(Boolean),d:P.beatDelay(),e:P.MUS.eighth}})()")
        print("SNAP on chord",r["ok"],"beat delay ok",0<=r["d"]<=r["e"]/2+.01)
        await pg.evaluate("__pip.S.pips.forEach(p=>{const r=__pip.rt(p);r.state='idle';r.need=null})");await pg.evaluate("__pip.humTick(999)")
        print("HUM",await pg.evaluate("__pip.S.stats.hums||0"))
        await pg.evaluate("__pip.S.music=false");await pg.wait_for_timeout(2500)
        print("MUSIC off untouched",await pg.evaluate("__pip.snapF(523)")==523,"no delay",await pg.evaluate("__pip.beatDelay()")==0)
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
