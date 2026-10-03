import asyncio,json,random,time,os
from playwright.async_api import async_playwright
random.seed(4)
now=int(time.time()*1000)
def pip(i):
    return {"id":f"p{i}","name":"פיפי" if i==0 else f"פי{i}","founder":i==0,"hue":random.uniform(46,132),"sprout":i%6,"pitch":600,"xp":200,"growth":0,"food":80,"mood":70,"energy":90,"trust":60,"mem":[],"c":{"work":1,"talk":1,"pet":1,"task":0},"vocab":["שמש"],"lang":{"food":"בלופ"},"gen":2,"parent":None,"born":now-3600000,"life":7*86400000,"convo":[],"x":random.uniform(90,240),"y":random.uniform(64,90),"g":{"pattern":0,"tail":0,"eyes":0,"body":0},"mut":None}
def save(story,extra={}):
    d={"v":1,"sparks":250,"basket":10,"wood":60,"seeds":[True,False,False],"stats":{"splits":5},"quest":99,"ai":True,"sound":False,"fastStory":True,"lastSeen":now,"born":now-86400000*3,"plots":[{"owned":True,"crop":None}]*2+[{"owned":False,"crop":None}]*7,"tasks":[],"lex":{"בלופ":{"c":"food","ok":False}},"hol":{"simchat:5787":1},"nextEvent":now+9e9,"pips":[pip(i) for i in range(12)],"story":story}
    d.update(extra);return d
base=lambda **k: dict({"ch":0,"frag":0,"kind":0,"ctrl":0,"started":now,"nextGlitch":0,"glitch":None,"choices":[],"ending":None,"site":None},**k)
async def page(b,d,errs,tag):
    pg=await b.new_page(viewport={"width":1280,"height":800})
    pg.on("pageerror",lambda e:errs.append(tag+": "+str(e)));pg.on("console",lambda m:errs.append(tag+": "+m.text) if m.type=="error" and "ERR_" not in m.text else None)
    await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
    await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500)
    return pg
async def tapw(pg,wx,wy):
    # world point -> screen point through the real camera
    box=await pg.locator("#cv").bounding_box();c=await pg.evaluate("({x:__pip.cam.x,y:__pip.cam.y,z:__pip.cam.z,CW:__pip.CW,CH:__pip.CH})")
    await pg.mouse.click(box["x"]+(wx-c["x"])*c["z"]/c["CW"]*box["width"],box["y"]+(wy-c["y"])*c["z"]/c["CH"]*box["height"])
async def skip(pg):
    await pg.wait_for_timeout(500)
    if await pg.locator("#story").is_visible(): await pg.locator("#sBox").click(position={"x":12,"y":8})
    await pg.wait_for_timeout(300)
async def btn(pg,text):
    await skip(pg);await pg.locator("#sChoices button",has_text=text).first.click();await pg.wait_for_timeout(400)
async def state(pg):
    await pg.wait_for_timeout(2200);return json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        # C2 apology retry comes back
        pg=await page(b,save(base(ch=5,frag=7,choices=["ignore","erase","fence","sorry"],kind=3,ctrl=5,fence=250,retryDay="2000-01-01",retryAt=now-300000)),errs,"C2")
        await pg.wait_for_timeout(5000);vis=await pg.locator("#story").is_visible();t=await pg.locator("#sTitle").text_content();print("C2 request again",vis,t)
        await btn(pg,"סליחה");st=await state(pg);print("C2 kind",st["story"]["kind"],"ctrl",st["story"]["ctrl"])
        await pg.wait_for_timeout(2500);await skip(pg);t=await pg.locator("#sTitle").text_content();print("C2 next card",t)
        # D2 restore
        d=save(base(ch=7,frag=7,choices=["ignore","erase","fence","reset"],kind=0,ctrl=5,fence=250,ending="reset",endAt=now-2*86400000,backup={"lex":{"בלופ":{"c":"food","ok":False}},"trust":{"p0":50},"lang":{"p0":{"food":"בלופ"}}}))
        for q in d["pips"]: q["blank"]=True;q["lang"]={}
        pg=await page(b,d,errs,"D2");await pg.wait_for_timeout(4500);st2=await state(pg);g=st2["story"]["glitch"];print("D2 glitch",g)
        await tapw(pg,g["x"],g["y"]-6);await btn(pg,"לשחזר");await pg.wait_for_timeout(2600)
        st3=await state(pg);print("D2 ending",st3["story"]["ending"],"ch",st3["story"]["ch"],"kind",st3["story"]["kind"],"blank",sum(1 for q in st3["pips"] if q.get("blank")),"sparks",st3["sparks"])
        await skip(pg);t=await pg.locator("#sTitle").text_content();print("D2 next card",t)
        # E2 daily note
        d=save(base(ch=7,frag=7,choices=["wave","game","window","gate","free"],kind=5,ending="free",note="2000-01-01",site={"k":"gate","p":100,"x":244,"y":163}))
        pg=await page(b,d,errs,"E2");await pg.wait_for_timeout(5000);st=await state(pg);print("E2 note drawings",len(st["drawings"]))
        print("ERR",errs[:8])
        await b.close()
if __name__=="__main__": asyncio.run(main())
