import { auth,database,functions } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref,onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { SHOP_ITEMS } from "./catalog.js";

const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString("en-GB");
let user=null,profile=null;
let bets={bj:100,hl:100,slot:100};
let bjState=null,hlState=null,busy=false;

// V3.2: create callable references once instead of rebuilding them for every click.
const casinoFns={
  ensure:httpsCallable(functions,"v3devCasinoEnsure"),
  bjStart:httpsCallable(functions,"v3devCasinoBlackjackStart"),
  bjAction:httpsCallable(functions,"v3devCasinoBlackjackAction"),
  hlStart:httpsCallable(functions,"v3devCasinoHigherLowerStart"),
  hlGuess:httpsCallable(functions,"v3devCasinoHigherLowerGuess"),
  slots:httpsCallable(functions,"v3devCasinoSlotsSpin")
};

function toast(text,type=""){
  const el=$("casinoToast"); el.textContent=text; el.className=`casino-toast ${type}`.trim();
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add("hidden"),2800); el.classList.remove("hidden");
}
function safeMessage(err){return String(err?.message||"Casino request failed").replace(/^FirebaseError:\s*/i,"");}
function casinoBurst(){
  const id=profile?.cosmetics?.casinoEffect;if(!id)return;
  const layer=$("casinoEffectLayer"),sets={"casino-effect-jackpot":["🎰","🪙","✨"],"casino-effect-lightning":["⚡","🌩️","✨"],"casino-effect-sassy":["👑","🎖️","💎","✨"]},bits=sets[id]||["✨"];
  layer.innerHTML="";for(let i=0;i<24;i++){const b=document.createElement("b");b.textContent=bits[i%bits.length];b.style.left=`${5+Math.random()*90}%`;b.style.animationDelay=`${Math.random()*.5}s`;layer.appendChild(b);}layer.classList.remove("play");void layer.offsetWidth;layer.classList.add("play");setTimeout(()=>layer.classList.remove("play"),2600);
}
function setBusy(on){
  busy=on;
  // Only touch gameplay controls. Updating every button on the page caused needless
  // style/layout work on each Firebase round-trip.
  document.querySelectorAll(".casino-game-view button, .chip-row button").forEach(b=>b.classList.toggle("soft-disabled",on));
}
function setWaiting(target,on,text="Waiting for the House…"){
  const el=$(target); if(!el)return;
  el.classList.toggle("casino-waiting",on);
  if(on&&text) el.dataset.waitingText=text;
}
function applyEconomy(state){
  if(!state)return;
  const wallet=state.wallet||{},stats=state.stats||{},house=state.house||{};
  $("casinoCoins").textContent=fmt(wallet.coins??100000);
  $("houseBalance").textContent=fmt(house.houseBalance??250000);
  $("publicWagered").textContent=`${fmt(house.totalWagered||0)} 🧪`;
  $("publicGames").textContent=fmt(house.rounds||0);
  const pl=Number(stats.paidOut||0)-Number(stats.wagered||0);
  $("playerCasinoPL").textContent=`${pl>=0?"+":""}${fmt(pl)} 🧪`;
  $("houseMood").textContent=Number(house.houseProfit||0)>=0?"The dev House is smug.":"General Sassy is losing test money.";
}
async function snapshot(){
  const data=(await casinoFns.ensure({})).data;
  applyEconomy(data);return data;
}

function cardMarkup(code,hidden=false){
  if(hidden)return `<div class="playing-card card-back"><span>GS</span><b>🎖️</b></div>`;
  const m=String(code||"").match(/^(10|[2-9JQKA])([SHDC])$/); if(!m)return `<div class="playing-card">?</div>`;
  const suits={S:["♠","black"],H:["♥","red"],D:["♦","red"],C:["♣","black"]}; const [symbol,colour]=suits[m[2]];
  return `<div class="playing-card ${colour}"><span>${m[1]}${symbol}</span><b>${symbol}</b><span>${m[1]}${symbol}</span></div>`;
}
function renderHand(target,cards,hideSecond=false){
  const el=$(target), previous=el.dataset.cards||"";
  const next=(cards||[]).join("|")+`:${hideSecond}`;
  el.innerHTML=(cards||[]).map((c,i)=>cardMarkup(c,hideSecond&&i===1)).join("")||`<div class="empty-card">?</div>`;
  if(previous!==next){
    [...el.children].forEach((card,i)=>{card.classList.add("deal-in");card.style.animationDelay=`${i*90}ms`;});
    el.dataset.cards=next;
  }
}
function setBet(target,n){bets[target]=Number(n);document.querySelectorAll(`.chip-row[data-target="${target}"] button`).forEach(b=>b.classList.toggle("selected",Number(b.dataset.bet)===bets[target])); if(target==="slot")$("slotBetText").textContent=`${fmt(n)} 🧪`;}
document.querySelectorAll(".chip-row button").forEach(b=>b.onclick=()=>{if(busy)return;setBet(b.closest(".chip-row").dataset.target,Number(b.dataset.bet));});
document.querySelectorAll(".casino-game-tabs button").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".casino-game-tabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  document.querySelectorAll(".casino-game-view").forEach(v=>v.classList.remove("active"));
  $(`casino${btn.dataset.game[0].toUpperCase()+btn.dataset.game.slice(1)}`).classList.add("active");
});
function cosmeticName(id,fallback){return SHOP_ITEMS.find(x=>x.id===id)?.name||fallback;}
function applyCasinoCosmetics(){
  if(!profile)return;const c=profile.cosmetics||{};
  $("eqCardBack").textContent=cosmeticName(c.cardBack,"Classic");$("eqTable").textContent=cosmeticName(c.tableSkin,"House Green");$("eqChips").textContent=cosmeticName(c.chipSet,"Classic");
  $("casinoShell").dataset.table=c.tableSkin||"default";$("casinoShell").dataset.cardback=c.cardBack||"default";$("casinoShell").dataset.chips=c.chipSet||"default";$("casinoTitle").textContent=c.casinoTitle?cosmeticName(c.casinoTitle,""):"";
}
function renderBJ(data){
  bjState=data||null; $("blackjackTable").dataset.outcome=data?.outcome||""; const active=data?.state==="active";
  $("bjBet").textContent=fmt(data?.bet||0); renderHand("playerCards",data?.playerCards||[]); renderHand("dealerCards",data?.dealerCards||[],Boolean(data?.dealerHidden));
  $("playerScore").textContent=data?.playerScore!=null?`(${data.playerScore})`:"";$("dealerScore").textContent=data?.dealerScore!=null?`(${data.dealerScore})`:"";
  $("bjStatus").textContent=data?.message||"Choose your stake and deal.";$("bjActions").classList.toggle("hidden",!active);$("bjBetPanel").classList.toggle("hidden",active);$("bjDouble").disabled=!active||!data?.canDouble;
}
async function callFn(fn,payload){
  setBusy(true);
  try{
    const d=(await fn(payload)).data;
    if(d?.economy)applyEconomy(d.economy);
    return d;
  }finally{setBusy(false);}
}
$("bjDeal").onclick=async()=>{try{setWaiting("blackjackTable",true,"Dealing…");const d=await callFn(casinoFns.bjStart,{bet:bets.bj});renderBJ(d);toast("DEV hand dealt.");}catch(e){toast(safeMessage(e),"error");}finally{setWaiting("blackjackTable",false);}};
async function bjAction(action){try{setWaiting("blackjackTable",true,action==="hit"?"Drawing card…":"Dealer thinking…");const d=await callFn(casinoFns.bjAction,{action});renderBJ(d);if(d.state!=="active"){toast(d.message,d.outcome==="win"?"win":d.outcome==="loss"?"error":"");if(d.outcome==="win")casinoBurst();}}catch(e){toast(safeMessage(e),"error");}finally{setWaiting("blackjackTable",false);}}
$("bjHit").onclick=()=>bjAction("hit");$("bjStand").onclick=()=>bjAction("stand");$("bjDouble").onclick=()=>bjAction("double");
function prettyCard(code){const m=String(code||"").match(/^(10|[2-9JQKA])([SHDC])$/);if(!m)return"?";const s={S:"♠",H:"♥",D:"♦",C:"♣"}[m[2]];return `${m[1]}${s}`;}
function renderHL(data){
  hlState=data||null; document.querySelector(".hl-table").dataset.outcome=data?.outcome||"";const active=data?.state==="active";$("hlBet").textContent=fmt(data?.bet||0);$("hlCurrentCard").textContent=prettyCard(data?.currentCard);$("hlNextCard").textContent=data?.nextCard?prettyCard(data.nextCard):"?";$("hlNextCard").classList.toggle("hidden-card",!data?.nextCard);$("hlStatus").textContent=data?.message||"Choose your stake to reveal the first card.";$("hlActions").classList.toggle("hidden",!active);$("hlBetPanel").classList.toggle("hidden",active);
}
$("hlStart").onclick=async()=>{try{setWaiting("hlCurrentCard",true,"Revealing…");const d=await callFn(casinoFns.hlStart,{bet:bets.hl});renderHL(d);toast("First card revealed. Make your choice.");}catch(e){toast(safeMessage(e),"error");}finally{setWaiting("hlCurrentCard",false);}};
async function hlGuess(guess){try{setWaiting("hlNextCard",true,"Flipping…");const d=await callFn(casinoFns.hlGuess,{guess});renderHL(d);toast(d.message,d.outcome==="win"?"win":d.outcome==="loss"?"error":"");if(d.outcome==="win")casinoBurst();}catch(e){toast(safeMessage(e),"error");}finally{setWaiting("hlNextCard",false);}}
$("hlHigher").onclick=()=>hlGuess("higher");$("hlLower").onclick=()=>hlGuess("lower");
function startSlotRoll(){
  const symbols=["🍒","🔔","💎","7️⃣","👑","🎖️"];
  const startedAt=performance.now();
  const minimumSpinMs=1450;
  let frame=0,stopped=false,raf=0,last=0;
  $("slotMachine").classList.add("spinning");
  $("slotStatus").className="slot-win";
  $("slotStatus").textContent="SPINNING…";

  // Keep the visual work deliberately light: roughly 8 symbol updates/second.
  // This looks smoother on slower phones/laptops than hammering the DOM every frame.
  const tick=t=>{
    if(stopped)return;
    if(t-last>125){
      last=t;
      frame++;
      ["reel1","reel2","reel3"].forEach((id,i)=>{
        $(id).textContent=symbols[(frame+i+Math.floor(Math.random()*symbols.length))%symbols.length];
      });
    }
    raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);

  return async final=>{
    // Even if Firebase responds instantly, let the reels visibly spin first.
    const remaining=Math.max(0,minimumSpinMs-(performance.now()-startedAt));
    if(remaining)await new Promise(r=>setTimeout(r,remaining));

    stopped=true;
    cancelAnimationFrame(raf);

    const ids=["reel1","reel2","reel3"];
    for(let i=0;i<ids.length;i++){
      $(ids[i]).textContent=final[i];
      $(ids[i]).classList.add("reel-land");
      await new Promise(r=>setTimeout(r,230));
      $(ids[i]).classList.remove("reel-land");
    }
    $("slotMachine").classList.remove("spinning");
  };
}
$("slotSpin").onclick=async()=>{
  if(busy)return;
  setBusy(true);
  const finishRoll=startSlotRoll(); // starts immediately while the secure result is fetched
  try{
    const data=(await casinoFns.slots({bet:bets.slot,machine:"classic"})).data;
    if(data?.economy)applyEconomy(data.economy);
    await finishRoll(data.reels);
    $("slotStatus").textContent=data.message;
    $("slotStatus").className=`slot-win ${data.payout>data.bet?"win":data.payout===data.bet?"push":"loss"}`;
    toast(data.message,data.payout>data.bet?"win":data.payout?"":"error");
    if(data.payout>data.bet){casinoBurst();document.body.classList.add("casino-win-flash");setTimeout(()=>document.body.classList.remove("casino-win-flash"),900);}

    // Tiny settle gap so rapid clicking cannot make the machine feel like it is
    // tripping over the previous animation/update.
    await new Promise(r=>setTimeout(r,300));
  }catch(e){
    await finishRoll(["?","?","?"]);
    toast(safeMessage(e),"error");
    await new Promise(r=>setTimeout(r,300));
  }finally{setBusy(false);}
};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href="./index.html";return;}

  // V3 DEV access is authorised by the server-side callable.
  // Do not directly read v3/dev/testers here: those paths are intentionally
  // protected from browser reads.
  try{
    const state=await snapshot();
    user=u;
    applyEconomy(state);
    onValue(ref(database,`v2/profiles/${u.uid}`),s=>{
      profile=s.val();
      if(!profile)return;
      $("casinoPlayer").textContent=profile.username||"Player";
      applyCasinoCosmetics();
    });
  }catch(e){
    console.error("V3 DEV casino access denied",e);
    location.href="./index.html";
  }
});
