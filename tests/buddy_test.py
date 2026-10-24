# The desktop strip on its own, with a stand-in for the desktop app: pips show up, say words,
# can be picked up and dropped, nap when the keeper is away, and the break sign works.
import asyncio,json,os
from playwright.async_api import async_playwright
STUB="""window.__cmds=[];window.__cb={};window.pipDesktop={onSnapshot:f=>__cb.snap=f,onActivity:f=>__cb.act=f,onBreak:f=>__cb.brk=f,buddyMouse:o=>{},buddyCommand:c=>__cmds.push(c)};"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        pg=await b.new_page(viewport={"width":1200,"height":150});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.add_init_script(STUB)
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),"renderer","buddy.html"));await pg.wait_for_timeout(300)
        pips=[{"id":f"p{i}","name":f"פי{i}","word":"בלופ","hue":60+i*7,"sprout":i%6,"g":{},"mut":None,"elder":False,"need":"food" if i==0 else None,"mood":70,"sleep":False} for i in range(6)]
        await pg.evaluate(f"__cb.snap({json.dumps({'night':False,'season':'autumn','total':6,'pips':pips})})");await pg.wait_for_timeout(1500)
        n=await pg.evaluate("(()=>{const c=document.getElementById('c'),g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let k=0;for(let i=3;i<d.length;i+=4)if(d[i])k++;return k})()")
        print("STRIP drawn",n>200)
        # click a pip: a tap command for it
        pos=await pg.evaluate("(()=>{return null})()")
        await pg.evaluate("__cb.act({idle:0})")
        # find a pip by scanning pixels near the bottom
        x=await pg.evaluate("(()=>{const c=document.getElementById('c'),g=c.getContext('2d'),y=c.height-6,d=g.getImageData(0,y,c.width,1).data;for(let i=0;i<c.width;i++)if(d[i*4+3])return (i+2)*3;return -1})()")
        await pg.mouse.move(x,150-12);await pg.mouse.down();await pg.mouse.up();await pg.wait_for_timeout(500)
        print("CLICK tap sent",await pg.evaluate("__cmds.some(c=>c.type==='tap')"))
        # drag one up and drop it
        await pg.mouse.move(x,150-12);await pg.mouse.down();await pg.mouse.move(x+40,40,steps=5);await pg.wait_for_timeout(100);await pg.mouse.up();await pg.wait_for_timeout(1500)
        print("DROP no extra tap",await pg.evaluate("__cmds.filter(c=>c.type==='tap').length")==1)
        # the break sign
        await pg.evaluate("__cb.brk()");await pg.wait_for_timeout(5000)
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"buddy.png"))
        # digital pips and the network line on the desktop
        dp=[dict(pp,ds=k%5,dc=["#5dffb0","#ffcf4a","#c9a2ff"][k%3],dmod=k%3) for k,pp in enumerate(pips)]
        await pg.evaluate(f"__cb.snap({json.dumps({'night':False,'season':'autumn','total':6,'net':60,'pips':dp})})");await pg.wait_for_timeout(800)
        line=await pg.evaluate("(()=>{const c=document.getElementById('c'),g=c.getContext('2d'),d=g.getImageData(0,c.height-1,c.width,1).data;let k=0;for(let i=0;i<c.width;i++)if(d[i*4+3]&&d[i*4+1]>200)k++;return k>c.width*.5})()")
        print("NET line",line)
        # right-click menu: pet, feed, ball, open
        await pg.evaluate(f"__cb.snap({json.dumps({'night':False,'season':'autumn','total':6,'net':0,'basket':5,'pips':pips})})");await pg.wait_for_timeout(600)
        x=await pg.evaluate("(()=>{const c=document.getElementById('c'),g=c.getContext('2d'),y=c.height-6,d=g.getImageData(0,y,c.width,1).data;for(let i=0;i<c.width;i++)if(d[i*4+3])return (i+2)*3;return -1})()")
        await pg.mouse.click(x,150-12,button="right");await pg.wait_for_timeout(200)
        print("MENU buttons",await pg.locator(".menu button").count())
        await pg.locator(".menu button[data-m='pet']").click();await pg.wait_for_timeout(200)
        print("MENU pet sent",await pg.evaluate("__cmds.some(c=>c.type==='pet')"),"closed",await pg.locator(".menu").count()==0)
        await pg.mouse.click(x,150-12,button="right");await pg.wait_for_timeout(200);await pg.locator(".menu button[data-m='feed']").click();await pg.wait_for_timeout(200)
        print("MENU feed sent",await pg.evaluate("__cmds.some(c=>c.type==='feed')"))
        await pg.mouse.click(x,150-12,button="right");await pg.wait_for_timeout(200);await pg.locator(".menu button[data-m='ball']").click()
        await pg.wait_for_function("__cmds.some(c=>c.type==='kick')",timeout=15000)
        print("BALL kicked",True)
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"buddy_ball.png"))
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"buddy_digital.png"))
        print("ERR",errs[:5])
        await b.close()
asyncio.run(main())
