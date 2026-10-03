/* ================= constants ================= */
const W=256,H=168,KEY="pipfarm.v1",WW=640,WH=336,CW=512,CH=336,HMIN=46,HMAX=132;
const PLOTS=[{x:82,y:30},{x:140,y:30},{x:198,y:30},{x:82,y:92},{x:140,y:92},{x:198,y:92},{x:282,y:196,z:"meadow"},{x:340,y:196,z:"meadow"},{x:398,y:196,z:"meadow"}];
const PW=48,PH=30;
const PLOT_COST=[0,0,25,60,110,180,90,130,180];
const ZONES=[
 {id:"farm",name:"החווה",x:0,y:0,w:256,h:168,cost:0,col:"#4b7d40"},
 {id:"forest",name:"היער",x:256,y:0,w:208,h:168,cost:40,desc:"פירות יער שהפיפים אוספים לסל",col:"#2f5a2c"},
 {id:"river",name:"הנהר",x:464,y:0,w:176,h:336,cost:80,desc:"דייג: דגים לסל, ולפעמים דג זהב",col:"#3e7db1"},
 {id:"meadow",name:"האחו",x:256,y:168,w:208,h:168,cost:100,desc:"עוד 3 חלקות ומקום לעוד 2 שבטים",col:"#6a9e4f"},
 {id:"cave",name:"המערה",x:0,y:168,w:256,h:168,cost:150,desc:"גבישים שנותנים ניצוצות. פיפים שכורים בה מולידים לפעמים פיפי קריסטל",col:"#6b6257"}];
const CMUSH=[{x:30,y:262},{x:62,y:318},{x:196,y:228},{x:236,y:288},{x:150,y:322},{x:104,y:246}];
const BURROW={x:34,y:46}, POND={x:34,y:140,rx:24,ry:13};
const CROPS=[
  {name:"צנון",grow:120,spark:3,yld:2,cost:0,fruit:"#ff5d73",leaf:"#6fcf5a"},
  {name:"דלעת ירח",grow:360,spark:10,yld:4,cost:40,fruit:"#ffb347",leaf:"#59b852"},
  {name:"פרח כוכב",grow:900,spark:30,yld:2,cost:120,fruit:"#c9a2ff",leaf:"#4fae7a",star:true}
];
const SYL=["פי","פו","מי","בלו","טיק","נו","פיפ","מוק","לי","בי","דו","קי","פופ","וי","מו","בופ","טי","לו"];
const NA=["פי","מו","בו","טו","לו","קי","נו","זו","בי","דו","פו","רי","שו","גי","צי","מי"];
const NB=["פי","צי","מו","לי","קו","נה","בו","טי","זי","פה","לה","שי"];
const STOP=new Set("של את על זה זאת אני אתה את הוא היא הם הן אנחנו לא כן מה מי גם עם אבל או כי יש אין רק כל היה היתה אם אז לי לך לו לה שלי שלך שלו הזה הזאת כמו עוד מאוד ממש אולי איך למה כבר עכשיו פה שם אחד אחת אותך אותי אותו אותה איתך איתי שלכם הייתי the a an to of and is are you i it in on".split(" "));
const SOUNDS={
  happy:["פיפ!","טרילי","♪","פי-פי","יייפ!","בלופ ♪"],
  excited:["!!","פיפיפיפ!","יאיי!","♪♫","וווּ!"],
  content:["♪","מררר","פיפ","טיק טיק","פופ"],
  curious:["?","פי?","הממ?","?!","בופ?"],
  sad:["מיו…","פפף…","…","וו…"],
  hungry:["גררר","מיו…","נום?","…"],
  sleepy:["זזז","ממם…","…","פ-פ-פ…"],
  scared:["!?","איק!","פפ!","!!!"]};
const CONCEPTS:Record<string,string>={food:"אוכל",sleep:"שינה",love:"ליטוף ואהבה",play:"משחק",fear:"פחד",day:"בוקר ושמש",night:"לילה",keeper:"אתה, השומר",friend:"חבר",water:"מים",work:"עבודה בשדה"};
const CONCEPT_REACT:Record<string,string[]>={food:["excited","hop"],sleep:["sleepy","none"],love:["happy","nuzzle"],play:["excited","dance"],fear:["scared","hide"],day:["happy","hop"],night:["sleepy","none"],keeper:["excited","nuzzle"],friend:["happy","spin"],water:["curious","spin"],work:["content","hop"]};
const LSYL=["בלו","פי","מו","טק","זו","רי","גו","נו","קי","לופ","פופ","ביק","מיפ","דו","שי","וו","טרו","גל","פם","זיפ","קו","לי"];
const MUTS=["glow","wings","crystal","gold","tiny","rainbow"];
const ALBUM=[
 {k:"head",t:"ראש",items:["עלה","אוזניים","אנטנה","ציצית","פרח","קרניים"]},
 {k:"pattern",t:"דוגמה",items:["חלק","נקודות","כיפה","בטן בהירה","נמשים"]},
 {k:"tail",t:"זנב",items:["בלי זנב","זנב מסולסל","זנב פומפום","זנב עלה"]},
 {k:"eyes",t:"עיניים",items:["עיני נקודה","עיניים גדולות","עיניים מנומנמות"]},
 {k:"body",t:"גוף",items:["רגיל","עגלגל"]},
 {k:"mut",t:"מוטציות נדירות",items:["זוהר","כנפיים","קריסטל","זהב","זעיר","קשת"],rare:true}];
const GENE_W={pattern:[.4,.15,.15,.15,.15],tail:[.5,.17,.17,.16],eyes:[.6,.25,.15],body:[.8,.2]};
const HEAD_W=[.2,.2,.2,.2,.1,.1];
const NEED_CONCEPT={food:"food",pet:"love",play:"play",talk:"keeper"};
const PROG=[[0,4,7],[7,11,14],[9,12,16],[5,9,12]];
const PENTA=[12,14,16,19,21,24];
const MOOD_WORDS={happy:["יאי","אוהב","שמש","טוב"],excited:["וואו","עוד","יאללה"],content:["נעים","ביחד"],curious:["מה","למה","מי"],sad:["עצוב","לבד"],hungry:["רעב","אוכל","צנון"],sleepy:["לילה","שינה"],scared:["לא","די"]};
const MOOD_SFX={happy:[1,1.26,1.5],excited:[1,1.5,2,1.5,2],content:[1,.9,1],curious:[1,1.2,1.45],sad:[1,.85,.7],hungry:[.8,.7,.75],sleepy:[.7,.6],scared:[1.8,2.1,1.9]};
const TRAIT_NAME={work:"חרוץ",talk:"פטפטן",pet:"מתרפק",task:"שאפתן"};
const TRAIT_COL={work:"#ffb347",talk:"#8fbfff",pet:"#ff7aa2",task:"#86d47f"};

