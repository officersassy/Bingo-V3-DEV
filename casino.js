import { auth,database,functions } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref,onValue,get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { SHOP_ITEMS } from "./catalog.js";

const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString("en-GB");
let user=null,profile=null;
let bets={bj:100,hl:100,slot:100};
let bjState=null,hlState=null,busy=false;

function toast(text,type=""){
  const el=$("casinoToast"); el.textContent=text; el.className=`casino-toast ${type}`.trim();
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add("hidden"),2800); el.classList.remove("hidden");
}
function safeMessage(err){return String(err?.message||"Casino request failed").replace(/^FirebaseError:\s*/i,"");}
async function isDevTester(uid){
  try{return (await get(ref(database,`v2/admins/${uid}`))).val()===true;}catch{return false;}
}
function casinoBurst(){
  const id=profile?.cosmetics?.casinoEffect;if(!id)return;
  const layer=$("casinoEffectLayer"),sets={"casino-effect-jackpot":["🎰","🪙","✨"],"casino-effect-lightning":["⚡","🌩️","✨"],"casino-effect-sassy":["👑","🎖️","💎","✨"]},bits=sets[id]||["✨"];
  layer.innerHTML="";for(let i=0;i<24;i++){const b=document.createElement("b");b.textContent=bits[i%bits.length];b.style.left=`${5+Math.random()*90}%`;b.style.animationDelay=`${Math.random()*.5}s`;layer.appendChild(b);}layer.classList.remove("play");void layer.offsetWidth;layer.classList.add("play");setTimeout(()=>layer.classList.remove("play"),2600);
}
function setBusy(on){busy=on;document.querySelectorAll("button").forEach(b=>{if(b.closest(".casino-game-tabs"))return;b.classList.toggle("soft-disabled",on);});}
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
  const data=(await httpsCallable(functions,"v3devCasinoEnsure")({})).data;
  applyEconomy(data);return data;
}

function cardMarkup(code,hidden=false){
  if(hidden)return `<div class="playing-card card-back"><span>GS</span><b>🎖️</b></div>`;
  const m=String(code||"").match(/^(10|[2-9JQKA])([SHDC])$/); if(!m)return `<div class="playing-card">?</div>`;
  const suits={S:["♠","black"],H:["♥","red"],D:["♦","red"],C:["♣","black"]}; const [symbol,colour]=suits[m[2]];
  return `<div class="playing-card ${colour}"><span>${m[1]}${symbol}</span><b>${symbol}</b><span>${m[1]}${symbol}</span></div>`;
}
function renderHand(target,cards,hideSecond=false){$(target).innerHTML=(cards||[]).map((c,i)=>cardMarkup(c,hideSecond&&i===1)).join("")||`<div class="empty-card">?</div>`;}
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
  bjState=data||null; const active=data?.state==="active";
  $("bjBet").textContent=fmt(data?.bet||0); renderHand("playerCards",data?.playerCards||[]); renderHand("dealerCards",data?.dealerCards||[],Boolean(data?.dealerHidden));
  $("playerScore").textContent=data?.playerScore!=null?`(${data.playerScore})`:"";$("dealerScore").textContent=data?.dealerScore!=null?`(${data.dealerScore})`:"";
  $("bjStatus").textContent=data?.message||"Choose your stake and deal.";$("bjActions").classList.toggle("hidden",!active);$("bjBetPanel").classList.toggle("hidden",active);$("bjDouble").disabled=!active||!data?.canDouble;
}
async function callFn(name,payload){setBusy(true);try{const d=(await httpsCallable(functions,name)(payload)).data;if(d?.economy)applyEconomy(d.economy);return d;}finally{setBusy(false);}}
$("bjDeal").onclick=async()=>{try{const d=await callFn("v3devCasinoBlackjackStart",{bet:bets.bj});renderBJ(d);toast("DEV hand dealt.");}catch(e){toast(safeMessage(e),"error");}};
async function bjAction(action){try{const d=await callFn("v3devCasinoBlackjackAction",{action});renderBJ(d);if(d.state!=="active"){toast(d.message,d.outcome==="win"?"win":d.outcome==="loss"?"error":"");if(d.outcome==="win")casinoBurst();}}catch(e){toast(safeMessage(e),"error");}}
$("bjHit").onclick=()=>bjAction("hit");$("bjStand").onclick=()=>bjAction("stand");$("bjDouble").onclick=()=>bjAction("double");
function prettyCard(code){const m=String(code||"").match(/^(10|[2-9JQKA])([SHDC])$/);if(!m)return"?";const s={S:"♠",H:"♥",D:"♦",C:"♣"}[m[2]];return `${m[1]}${s}`;}
function renderHL(data){
  hlState=data||null;const active=data?.state==="active";$("hlBet").textContent=fmt(data?.bet||0);$("hlCurrentCard").textContent=prettyCard(data?.currentCard);$("hlNextCard").textContent=data?.nextCard?prettyCard(data.nextCard):"?";$("hlNextCard").classList.toggle("hidden-card",!data?.nextCard);$("hlStatus").textContent=data?.message||"Choose your stake to reveal the first card.";$("hlActions").classList.toggle("hidden",!active);$("hlBetPanel").classList.toggle("hidden",active);
}
$("hlStart").onclick=async()=>{try{renderHL(await callFn("v3devCasinoHigherLowerStart",{bet:bets.hl}));}catch(e){toast(safeMessage(e),"error");}};
async function hlGuess(guess){try{const d=await callFn("v3devCasinoHigherLowerGuess",{guess});renderHL(d);toast(d.message,d.outcome==="win"?"win":d.outcome==="loss"?"error":"");if(d.outcome==="win")casinoBurst();}catch(e){toast(safeMessage(e),"error");}}
$("hlHigher").onclick=()=>hlGuess("higher");$("hlLower").onclick=()=>hlGuess("lower");
function animateSlots(final){
  const symbols=["🍒","🔔","💎","7️⃣","👑","🎖️"];let ticks=0;$("slotMachine").classList.add("spinning");$("slotStatus").textContent="SPINNING…";
  return new Promise(resolve=>{const timer=setInterval(()=>{ticks++;["reel1","reel2","reel3"].forEach((id,i)=>$(id).textContent=ticks>9+i*3?final[i]:symbols[Math.floor(Math.random()*symbols.length)]);if(ticks>17){clearInterval(timer);$("slotMachine").classList.remove("spinning");resolve();}},70);});
}
$("slotSpin").onclick=async()=>{if(busy)return;try{setBusy(true);const data=(await httpsCallable(functions,"v3devCasinoSlotsSpin")({bet:bets.slot,machine:"classic"})).data;if(data?.economy)applyEconomy(data.economy);await animateSlots(data.reels);$("slotStatus").textContent=data.message;$("slotStatus").className=`slot-win ${data.payout>data.bet?"win":data.payout===data.bet?"push":"loss"}`;toast(data.message,data.payout>data.bet?"win":data.payout?"":"error");if(data.payout>data.bet)casinoBurst();}catch(e){toast(safeMessage(e),"error");}finally{setBusy(false);}};

onAuthStateChanged(auth,async u=>{
  if(!u){location.href="./index.html";return;}
  if(!(await isDevTester(u.uid))){location.href="./index.html";return;}
  user=u;
  onValue(ref(database,`v2/profiles/${u.uid}`),s=>{profile=s.val();if(!profile)return;$("casinoPlayer").textContent=profile.username||"Player";applyCasinoCosmetics();});
  try{await snapshot();}catch(e){toast(safeMessage(e),"error");}
});
