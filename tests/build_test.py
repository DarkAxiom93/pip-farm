# Build mode: move a field, refuse a bad spot, add a field, paint a path, and it all survives a reload.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sparks":300})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x&&!localStorage.getItem('pf.noinject')){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500)
        await pg.evaluate("(()=>{const P=__pip;P.S.pips.forEach(p=>{p.x=240;p.y=20;const r=P.rt(p);r.state='sleep';r.nap=true});const c=P.cam;c.x=0;c.y=0;c.z=2})()")
        box=await pg.locator("#cv").bounding_box()
        def sp(wx,wy): return box["x"]+wx/256*box["width"],box["y"]+wy/168*box["height"]
        await pg.locator("#hBuild").click();await pg.wait_for_timeout(200)
        print("BUILD on",await pg.evaluate("__pip.buildMode"),"bar",await pg.locator("#buildBar").is_visible())
        # move field 3 (82,92) down to (40,100)... drag by its middle
        x,y=sp(106,107);await pg.mouse.move(x,y);await pg.mouse.down();tx,ty=sp(170,150);await pg.mouse.move(tx,ty,steps=8);await pg.mouse.up();await pg.wait_for_timeout(200)
        p3=await pg.evaluate("__pip.PLOTS[3]");print("MOVED field",p3["y"]>100)
        # onto another field: refused and back
        before=await pg.evaluate("[__pip.PLOTS[3].x,__pip.PLOTS[3].y]")
        x,y=sp(p3["x"]+24,p3["y"]+15);await pg.mouse.move(x,y);await pg.mouse.down();tx,ty=sp(164,45);await pg.mouse.move(tx,ty,steps=8);await pg.mouse.up();await pg.wait_for_timeout(200)
        print("BAD spot back",await pg.evaluate("[__pip.PLOTS[3].x,__pip.PLOTS[3].y]")==before)
        # a new field
        n0=await pg.evaluate("__pip.PLOTS.length");s0=await pg.evaluate("__pip.S.sparks")
        await pg.locator("#buildBar [data-tool='plot']").click();x,y=sp(100,150);await pg.mouse.click(x,y);await pg.wait_for_timeout(300)
        print("NEW field",await pg.evaluate("__pip.PLOTS.length")==n0+1,"owned",await pg.evaluate("__pip.S.plots[__pip.S.plots.length-1].owned"),"paid",s0-await pg.evaluate("__pip.S.sparks"))
        # paint a path
        await pg.locator("#buildBar [data-tool='path']").click();x,y=sp(140,128);await pg.mouse.move(x,y);await pg.mouse.down();tx,ty=sp(250,128);await pg.mouse.move(tx,ty,steps=12);await pg.mouse.up()
        print("PAINT cells",await pg.evaluate("Object.keys(__pip.S.paint||{}).length")>=8)
        await pg.locator("#buildBar [data-tool='done']").click();await pg.wait_for_timeout(2500)
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"build.png"))
        # reload
        await pg.evaluate("localStorage.setItem('pf.noinject','1')");await pg.reload();await pg.wait_for_timeout(2000)
        r=await pg.evaluate("({n:__pip.PLOTS.length,y3:__pip.PLOTS[3].y,paint:Object.keys(__pip.S.paint||{}).length,plots:__pip.S.plots.length})")
        print("RELOAD kept",r["n"]==n0+1 and r["plots"]==n0+1,"moved",r["y3"]==p3["y"],"paint",r["paint"]>=8)
        print("ERR",errs[:6])
        await b.close()
asyncio.run(main())
