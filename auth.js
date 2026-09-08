import { auth, database } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const $=id=>document.getElementById(id);
const loginTab=$("loginTab"),registerTab=$("registerTab"),loginForm=$("loginForm"),registerForm=$("registerForm"),message=$("authMessage");
let submitting=false;

function msg(text,type=""){message.textContent=text;message.className=`message-box ${type}`.trim();}
function mode(login){loginTab.classList.toggle("active",login);registerTab.classList.toggle("active",!login);loginForm.classList.toggle("hidden",!login);registerForm.classList.toggle("hidden",login);msg("");}
loginTab.onclick=()=>mode(true); registerTab.onclick=()=>msg("Account creation is disabled on the private V3 development build.","error");

function cleanUsername(value){
  return value.trim().toLowerCase();
}

function validUsername(value){
  return /^[a-z0-9._-]{2,24}$/.test(value);
}

function normaliseForModeration(value){
  return String(value||"")
    .toLowerCase()
    .replace(/[^a-z0-9]/g,"");
}

const BUILTIN_BANNED_USERNAME_TERMS=["fuck", "fucker", "fucking", "cunt", "shit", "bitch", "bastard", "dick", "cock", "pussy", "wanker", "twat", "slut", "whore", "porn", "porno", "sex", "nazi", "hitler"];


async function getBannedTerms(){
  try{
    const snap=await get(ref(database,"v2/bannedUsernameTerms"));
    const firebaseTerms=Object.values(snap.val()||{})
      .map(item=>String(item?.term||"").trim().toLowerCase())
      .filter(Boolean);

    return [...new Set([...BUILTIN_BANNED_USERNAME_TERMS,...firebaseTerms])];
  }catch(error){
    console.error("Could not load username ban list:",error);
    return BUILTIN_BANNED_USERNAME_TERMS;
  }
}

async function bannedUsernameReason(username){
  const normalised=normaliseForModeration(username);
  const terms=await getBannedTerms();

  for(const term of terms){
    const cleanTerm=normaliseForModeration(term);
    if(cleanTerm && normalised.includes(cleanTerm)){
      return term;
    }
  }

  return null;
}

function usernameEmail(username){
  // Firebase Auth still uses Email/Password internally, but players never need
  // to know or enter an email address.
  return `${username}@generalsassybingo.invalid`;
}

async function hasV3DevAccess(uid){
  try{
    const [adminSnap,testerSnap]=await Promise.all([
      get(ref(database,`v2/admins/${uid}`)),
      get(ref(database,`v3/dev/testers/${uid}`))
    ]);
    return adminSnap.val()===true || testerSnap.val()===true || testerSnap.val()?.enabled===true;
  }catch(error){
    // v3/dev is intentionally unreadable in production rules, so admin access
    // remains sufficient for the owner-only development build.
    try{return (await get(ref(database,`v2/admins/${uid}`))).val()===true;}catch{return false;}
  }
}

async function ensureProfile(user,name=""){
  const pRef=ref(database,`v2/profiles/${user.uid}`);
  const snap=await get(pRef);
  if(snap.exists()) return;

  const clean=(name||user.email?.split("@")[0]||"Player").trim().slice(0,24);
  const now=Date.now();

  const profile={
    uid:user.uid,
    username:clean,
    email:"",
    coins:25,
    lifetimeCoins:25,
    role:"player",
    createdAt:now,
    updatedAt:now,
    stats:{gamesPlayed:0,wins:0,fullHouses:0},
    cosmetics:{dabber:"default",theme:"default",nameEffect:"default",effect:"default"},
    inventory:{},
    achievements:{"account-created":now}
  };

  await set(pRef,profile);
}

loginForm.onsubmit=async e=>{
  e.preventDefault();
  submitting=true;

  try{
    const entered=$("loginUsername").value.trim();
    const isEmail=entered.includes("@");

    let firebaseLogin;
    let profileName="";

    if(isEmail){
      // Existing V2/admin accounts created before username login continue
      // using their original Firebase email address.
      firebaseLogin=entered.toLowerCase();
    }else{
      const username=cleanUsername(entered);

      if(!validUsername(username)){
        msg(
          "Username can use letters, numbers, dots, dashes and underscores.",
          "error"
        );
        return;
      }

      firebaseLogin=usernameEmail(username);
      profileName=username;
    }

    msg("Signing in...");

    const c=await signInWithEmailAndPassword(
      auth,
      firebaseLogin,
      $("loginPassword").value
    );

    await ensureProfile(c.user,profileName);

    if(!(await hasV3DevAccess(c.user.uid))){
      await auth.signOut();
      msg("This is a private V3 test build. Your account is not approved for testing.","error");
      return;
    }

    location.href="./hub.html";
  }catch(err){
    console.error(err);
    msg(
      "Could not sign in. Check your username/email and password.",
      "error"
    );
  }finally{
    submitting=false;
  }
};

registerForm.onsubmit=async e=>{
  e.preventDefault();
  msg("Account creation is disabled on the private V3 development build.","error");
  return;
  submitting=true;

  try{
    const username=cleanUsername($("registerName").value);

    if(!validUsername(username)){
      msg("Username must be 2–24 characters using letters, numbers, dots, dashes or underscores.","error");
      return;
    }

    const blockedTerm=await bannedUsernameReason(username);
    if(blockedTerm){
      msg("That username is not allowed. Choose another one.","error");
      return;
    }

    msg("Creating your account...");

    const c=await createUserWithEmailAndPassword(
      auth,
      usernameEmail(username),
      $("registerPassword").value
    );

    await ensureProfile(c.user,username);

    msg("Account created. 25 Sassy Coins issued.","success");
    setTimeout(()=>location.href="./hub.html",400);
  }catch(err){
    console.error(err);

    if(err.code==="auth/email-already-in-use"){
      msg("That username is already taken.","error");
    }else{
      msg("Could not create account.","error");
    }
  }finally{
    submitting=false;
  }
};

onAuthStateChanged(auth,user=>{
  if(user&&!submitting) location.href="./hub.html";
});
