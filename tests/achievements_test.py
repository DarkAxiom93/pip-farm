# Achievements unlock once and pay once; daily goals: three per day, rewards, the streak.
import asyncio,json
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"stats":{"splits":5,"harvests":60,"chops":0},"streak":{"days":0,"last":"","best":0}})
        pg=await page(b,d,errs,"A")
        await pg.wait_for_timeout(11500)
        a=await pg.evaluate("Object.keys(__pip.S.ach||{})");print("ACH unlocked pips10",'pips10' in a,"harv50",'harv50' in a,"not harv250",'harv250' not in a)
        await pg.evaluate("__pip.setTab('farm')");await pg.wait_for_timeout(300)
        print("ACH panel",await pg.locator("#achBox .ach.done").count()>=2,"total",await pg.locator("#achBox .ach").count()==await pg.evaluate("__pip.ACH.length"))
        # daily goals
        await pg.evaluate("__pip.setTab('tasks')");await pg.wait_for_timeout(300)
        g=await pg.evaluate("__pip.dailyToday().goals.map(q=>q.k)");print("DAILY goals",len(g),"distinct",len(set(g))==3,"shown",await pg.locator("#dailyBox .dgoal").count())
        sp=await pg.evaluate("__pip.S.sparks")
        for k in g: await pg.evaluate(f"__pip.goal('{k}',99)")
        await pg.wait_for_timeout(2000)
        r=await pg.evaluate("({all:__pip.S.daily.all,dd:__pip.S.stats.dailyDone,sp:__pip.S.sparks,streak:__pip.S.streak.days})")
        print("DAILY all",r["all"],"counted",r["dd"],"paid",r["sp"]-sp>=55,"streak",r["streak"]>=1)
        await pg.evaluate(f"__pip.goal('{g[0]}',5)");print("DAILY no double",await pg.evaluate("__pip.S.stats.dailyDone"))
        # reload: same goals, achievements are not paid twice
        await pg.wait_for_timeout(2500);await pg.evaluate("localStorage.setItem('pf.noinject','1')")
        sp=await pg.evaluate("__pip.S.sparks");await pg.reload();await pg.wait_for_timeout(7000)
        g2=await pg.evaluate("__pip.dailyToday().goals.map(q=>q.k)");sp2=await pg.evaluate("__pip.S.sparks")
        print("RELOAD same goals",g2==g,"no double pay",sp2-sp<25)
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
