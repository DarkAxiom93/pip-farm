/* particles & bubbles */
const parts=[];
function burst(x,y,kind,n){for(let i=0;i<n;i++)parts.push({x,y,vx:rand(-20,20),vy:rand(-34,-8),life:rand(.6,1.2),kind,c:pick(["#ffd166","#ff7aa2","#8fbfff","#86d47f","#ffffff"])})}
const bubbleEls=new Map();
function say(p,text,dur?,cls?,mood?){
  const box=$("bubbles");let b=bubbleEls.get(p.id);
  if(b&&b.classList.contains("q")&&cls!=="q")return;
  if(!b){if(bubbleEls.size>=7&&cls!=="q")return;b=document.createElement("div");box.appendChild(b);bubbleEls.set(p.id,b)}
  b.className="bub"+(cls?" "+cls:"");b.textContent=text;b._until=cls==="q"?Infinity:performance.now()+(dur||2.4)*1000;
  rt(p).talk=Math.min(1.2,.2+text.length*.05);
  if(cls==="q")SFX.q(p.pitch);else blip(p,mood||moodOf(p));
  placeBubble(p,b);
}
function clearBubble(id){const b=bubbleEls.get(id);if(b){b.remove();bubbleEls.delete(id)}}
function placeBubble(p,b){const[l,t]=scr(p.x,(rt(p).head??p.y-12)-3);b.style.left=l+"%";b.style.top=t+"%";b.style.visibility=l<-5||l>105||t<-5||t>110?"hidden":"visible"}

