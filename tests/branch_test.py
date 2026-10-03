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
        # A erase
        pg=await page(b,save(base(ch=2,frag=3,glitch={"x":150,"y":140},choices=["wave"],kind=1)),errs,"A")
        await tapw(pg,150,134);await btn(pg,"להמשיך");await pg.wait_for_timeout(1000);await btn(pg,"למחוק")
        st=await state(pg);lex=[v["c"] for v in st["lex"].values()]
        print("A ch",st["story"]["ch"],"ctrl",st["story"]["ctrl"],"screen words left","screen" in lex or "outside" in lex)
        await pg.wait_for_timeout(21000);st=await state(pg);print("A screen doodles",sum(1 for d in st["drawings"] if d["k"]=="screen"))
        # B fence
        pg=await page(b,save(base(ch=3,frag=4,glitch={"x":150,"y":140},choices=["wave","erase"],kind=1,ctrl=2)),errs,"B")
        await tapw(pg,150,134);await btn(pg,"להמשיך");await pg.wait_for_timeout(8000);await btn(pg,"גדר")
        st=await state(pg);print("B ch",st["story"]["ch"],"fence",st["story"].get("fence"),"ctrl",st["story"]["ctrl"])
        await pg.screenshot(path="bB.png")
        # C sorry (ctrl path)
        pg=await page(b,save(base(ch=4,frag=6,glitch={"x":150,"y":140},choices=["ignore","erase","fence"],kind=0,ctrl=5,fence=250)),errs,"C")
        await tapw(pg,150,134);await btn(pg,"להמשיך");await pg.wait_for_timeout(1500);await pg.screenshot(path="bC.png");await btn(pg,"סליחה")
        st=await state(pg);print("C ch",st["story"]["ch"],"kind",st["story"]["kind"],"ctrl",st["story"]["ctrl"])
        # D reset + redemption
        pg=await page(b,save(base(ch=5,frag=7,choices=["ignore","erase","fence"],kind=0,ctrl=5,fence=250)),errs,"D")
        await pg.wait_for_timeout(500)
        # trigger the dark request again through the journal-less path: seed ch4->frag7 instead
        pg=await page(b,save(base(ch=4,frag=6,glitch={"x":150,"y":140},choices=["ignore","erase","fence"],kind=0,ctrl=5,fence=250)),errs,"D")
        await tapw(pg,150,134);await btn(pg,"להמשיך");await pg.wait_for_timeout(1500);await btn(pg,"לאפס")
        await btn(pg,"להמשיך")
        st=await state(pg);print("D ending",st["story"]["ending"],"blank pips",sum(1 for q in st["pips"] if q.get("blank")),"lang empty",all(not q["lang"] for q in st["pips"]),"backup",bool(st["story"].get("backup")))
        await pg.screenshot(path="bD.png")
        st["story"]["endAt"]=now-2*86400000;st["story"]["glitch"]=None
        pg=await page(b,st,errs,"D2")
        await pg.wait_for_timeout(4500);st2=await state(pg);g=st2["story"]["glitch"];print("D2 redemption glitch",g)
        if g:
            box=await pg.locator("#cv").bounding_box()
            # camera may differ; zoom and center are default for farm
            await tapw(pg,g["x"],g["y"]-6);await pg.wait_for_timeout(800);await pg.screenshot(path="bD2.png");await btn(pg,"לשחזר")
            await pg.wait_for_timeout(2500)
            st3=await state(pg);print("D2 after restore ending",st3["story"]["ending"],"ch",st3["story"]["ch"],"kind",st3["story"]["kind"],"blank",sum(1 for q in st3["pips"] if q.get("blank")),"lang back",sum(1 for q in st3["pips"] if q["lang"]))
            await skip(pg);await pg.screenshot(path="bD3.png")
        # E free ending + daily note
        pg=await page(b,save(base(ch=6,frag=7,choices=["wave","game","window","gate"],kind=5,site={"k":"gate","p":100,"x":244,"y":163,"win":True})),errs,"E")
        await pg.wait_for_timeout(4000);await btn(pg,"לפתוח")
        await pg.wait_for_timeout(16000);await pg.screenshot(path="bE.png");await btn(pg,"להמשיך")
        st=await state(pg);print("E ending",st["story"]["ending"],"awake",sum(1 for q in st["pips"] if q.get("awake")))
        st["story"]["note"]="2000-01-01";st["drawings"]=[]
        pg=await page(b,st,errs,"E2");await pg.wait_for_timeout(5000)
        st=await state(pg);print("E2 note drawings",len(st["drawings"]))
        await pg.screenshot(path="bE2.png")
        print("ERR",errs[:8])
        await b.close()
if __name__=="__main__": asyncio.run(main())
