import asyncio,json,random,time,os
from playwright.async_api import async_playwright
random.seed(11)
now=int(time.time()*1000)
def pip(i):
    return {"id":f"p{i:03d}x","name":f"פי{i}","hue":random.uniform(46,132),"sprout":i%6,"pitch":random.uniform(400,900),"xp":random.uniform(0,900),"growth":0,"food":random.uniform(20,100),"mood":70,"energy":90,"trust":random.uniform(-30,90),"mem":[{"k":"pet","t":now}]*6,"c":{"work":i%5,"talk":3,"pet":1,"task":0},
     "vocab":[f"מילה{j}" for j in range(60)],"lang":{"food":"בלופ","friend":"זיפו","love":"מוקי","water":"גלי"},"gen":3,"parent":None,"born":now-3600000,"life":7*86400000,
     "convo":[{"r":"u","t":"שלום מה שלומך היום חבר שלי הקטן"},{"r":"p","t":"פיפ ♪","w":"שמש"}]*5,"x":random.uniform(10,620),"y":random.uniform(20,320),"g":{"pattern":i%5,"tail":i%4,"eyes":i%3,"body":i%2},"mut":None}
big={"v":1,"sparks":300,"basket":30,"seeds":[True,True,True],"stats":{"splits":5},"quest":99,"ai":True,"sound":True,"lastSeen":now,"born":now-86400000*20,"zones":{"forest":True,"river":True,"meadow":True,"cave":True},
 "plots":[{"owned":True,"crop":None}]*9,"tasks":[{"id":f"t{i}","text":"משימה ארוכה מספר "+str(i),"pip":"p001x","created":now,"done":i%2==0} for i in range(40)],
 "lex":{f"מילה{i}":{"c":"food","ok":False,"heard":3} for i in range(44)},"stars":[{"id":f"s{i}","name":"כוכב","hue":80,"gen":2,"days":7,"died":now,"trust":50,"words":3} for i in range(80)],"pips":[pip(i) for i in range(112)]}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        pg=await b.new_page(viewport={"width":1280,"height":800})
        pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:errs.append(m.text) if m.type=="error" and "ERR_" not in m.text else None)
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(big))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(3000)
        sz=await pg.evaluate("(localStorage.getItem('pipfarm.v1')||'').length")
        print("save chars(after load)",sz)
        await pg.wait_for_timeout(120000)
        st=await pg.evaluate("JSON.parse(localStorage.getItem('pipfarm.v1'))")
        print("pips",len(st["pips"]),"harvests",st["stats"].get("harvests"),"sparks",st["sparks"],"basket",st["basket"])
        print("plot crops",[ (pl.get("crop") or {}).get("type") for pl in st["plots"]])
        print("save bytes", len(json.dumps(st,ensure_ascii=False).encode()))
        await pg.screenshot(path="soak.png")
        print("ERR",errs[:5])
        ph=await b.new_page(viewport={"width":390,"height":844})
        await ph.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(big))+")}")
        await ph.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await ph.wait_for_timeout(3000)
        await ph.screenshot(path="phone.png")
        await b.close()
asyncio.run(main())
