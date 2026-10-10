# Easier controls: hover marks, keyboard moves and zooms the map and switches tabs, the map glides after a drag.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"zones":{"forest":1,"meadow":1,"river":1}})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500)
        await pg.evaluate("(()=>{const P=__pip;P.S.pips.forEach((p,i)=>{p.x=40+i*3;p.y=150;const r=P.rt(p);r.state='sleep';r.nap=true});const p=P.S.pips[0];p.x=150;p.y=110;P.rt(p).state='idle';P.rt(p).wait=99;const c=P.cam;c.x=0;c.y=0;c.z=2})()")
        box=await pg.locator("#cv").bounding_box()
        def sp(wx,wy): return box["x"]+wx/256*box["width"],box["y"]+wy/168*box["height"]
        x,y=sp(150,106);await pg.mouse.move(x,y);await pg.wait_for_timeout(150)
        print("HOVER pip",await pg.evaluate("__pip.hover&&__pip.hover.k"),"cursor",await pg.evaluate("document.getElementById('cv').style.cursor"))
        x,y=sp(106,104);await pg.mouse.move(x,y);await pg.wait_for_timeout(150)
        print("HOVER plot",await pg.evaluate("__pip.hover&&__pip.hover.k"))
        await pg.mouse.move(5,5)
        c0=await pg.evaluate("__pip.cam.x");await pg.keyboard.press("ArrowRight");await pg.wait_for_timeout(800)
        print("KEY move",await pg.evaluate("__pip.cam.x")>c0)
        z0=await pg.evaluate("__pip.cam.z");await pg.keyboard.press("=");await pg.wait_for_timeout(100)
        print("KEY zoom",await pg.evaluate("__pip.cam.z")>z0)
        await pg.keyboard.press("3");await pg.wait_for_timeout(100);print("KEY tab",await pg.evaluate("__pip.tab"))
        await pg.keyboard.press("1")
        # fling the map
        await pg.evaluate("(()=>{const c=__pip.cam;c.z=2;c.x=150;c.y=60})()")
        x,y=sp(200,90);await pg.mouse.move(x,y);await pg.mouse.down()
        for i in range(1,7): await pg.mouse.move(x-i*25,y,steps=1);await pg.wait_for_timeout(16)
        await pg.mouse.up();c1=await pg.evaluate("__pip.cam.x");await pg.wait_for_timeout(300);c2=await pg.evaluate("__pip.cam.x")
        print("GLIDE keeps moving",c2>c1+1)
        print("ERR",errs[:6])
        await b.close()
asyncio.run(main())
