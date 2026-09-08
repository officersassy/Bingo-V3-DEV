import { auth,database,functions } from "./firebase.js";
import { onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref,onValue,get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
const $=id=>document.getElementById(id),fmt=n=>Number(n||0).toLocaleString("en-GB");
async function allowed(uid){try{return (await get(ref(database,`v2/admins/${uid}`))).val()===true;}catch{return false;}}
onAuthStateChanged(auth,async user=>{
  if(!user){location.href="./index.html";return;}
  if(!(await allowed(user.uid))){await signOut(auth);location.href="./index.html";return;}
  onValue(ref(database,`v2/profiles/${user.uid}`),snap=>{const p=snap.val()||{};$("hubName").textContent=p.username||"Player";$("hubAvatar").textContent="🎖️";});
  try{const d=(await httpsCallable(functions,"v3devCasinoEnsure")({})).data;$("hubCoins").textContent=`${fmt(d.wallet?.coins)} TEST`;}catch{$("hubCoins").textContent="DEV";}
  const link=document.createElement("a");link.className="v3-admin-link";link.href="./casino-host.html";link.textContent="🎛️ DEV CASINO CONTROL";document.querySelector(".v3-hub-header").appendChild(link);
});
$("hubLogout").onclick=async()=>{await signOut(auth);location.href="./index.html";};
