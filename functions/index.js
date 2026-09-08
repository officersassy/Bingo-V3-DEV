const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({
  region: "europe-west1",
  maxInstances: 3
});



const DATABASE_URL =
  "https://bingo-5174e-default-rtdb.europe-west1.firebasedatabase.app";

let adminApp = null;

function getAdminServices() {
  const { initializeApp } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getDatabaseWithUrl } = require("firebase-admin/database");

  if (!adminApp) {
    adminApp = initializeApp({
      projectId: "bingo-5174e",
      databaseURL: DATABASE_URL
    });
  }

  return {
    auth: getAuth(adminApp),

    // IMPORTANT:
    // Explicitly target the exact Europe-West Realtime Database.
    // Do not let Admin SDK resolve a default database instance.
    db: getDatabaseWithUrl(DATABASE_URL, adminApp)
  };
}

const CRATE_PRICE = 1000;
const RARITY_WEIGHTS = {
  common:42,
  rare:30,
  epic:18,
  legendary:8,
  sassy:2
};

const CRATE_CATALOG = [
  {
    "id": "avatar-gold-crown",
    "name": "Golden Crown",
    "rarity": "rare"
  },
  {
    "id": "avatar-disco",
    "name": "Disco Ball",
    "rarity": "rare"
  },
  {
    "id": "avatar-fire",
    "name": "Flaming Bingo",
    "rarity": "rare"
  },
  {
    "id": "avatar-diamond",
    "name": "Diamond King",
    "rarity": "epic"
  },
  {
    "id": "avatar-leprechaun",
    "name": "Lucky Leprechaun",
    "rarity": "epic"
  },
  {
    "id": "avatar-disco-queen",
    "name": "Disco Queen",
    "rarity": "epic"
  },
  {
    "id": "avatar-skull",
    "name": "Neon Skull",
    "rarity": "epic"
  },
  {
    "id": "avatar-devil",
    "name": "Bingo Devil",
    "rarity": "epic"
  },
  {
    "id": "avatar-general",
    "name": "General Sassy",
    "rarity": "legendary"
  },
  {
    "id": "avatar-jackpot",
    "name": "Jackpot",
    "rarity": "legendary"
  },
  {
    "id": "avatar-sassy",
    "name": "Legendary General",
    "rarity": "sassy"
  },
  {
    "id": "dabber-blue",
    "name": "Electric Blue",
    "rarity": "common"
  },
  {
    "id": "dabber-pink",
    "name": "Hot Pink",
    "rarity": "common"
  },
  {
    "id": "dabber-green",
    "name": "Lucky Toxic",
    "rarity": "rare"
  },
  {
    "id": "dabber-gold",
    "name": "Midas Stamp",
    "rarity": "rare"
  },
  {
    "id": "dabber-plasma",
    "name": "Plasma Strike",
    "rarity": "epic"
  },
  {
    "id": "dabber-diamond",
    "name": "Diamond Impact",
    "rarity": "legendary"
  },
  {
    "id": "theme-neon",
    "name": "Neon Afterdark",
    "rarity": "rare"
  },
  {
    "id": "theme-gold",
    "name": "Royal Vault",
    "rarity": "epic"
  },
  {
    "id": "theme-fire",
    "name": "Inferno",
    "rarity": "epic"
  },
  {
    "id": "theme-rainbow",
    "name": "Prismatic Riot",
    "rarity": "legendary"
  },
  {
    "id": "theme-galaxy",
    "name": "Sassy Galaxy",
    "rarity": "legendary"
  },
  {
    "id": "theme-obsidian",
    "name": "Black Diamond",
    "rarity": "legendary"
  },
  {
    "id": "theme-general",
    "name": "General's Private Table",
    "rarity": "sassy"
  },
  {
    "id": "confetti-party",
    "name": "Confetti Cannon",
    "rarity": "rare"
  },
  {
    "id": "effect-fireworks",
    "name": "Firework Takeover",
    "rarity": "epic"
  },
  {
    "id": "effect-coin-rain",
    "name": "Coin Storm",
    "rarity": "legendary"
  },
  {
    "id": "effect-meteor",
    "name": "Meteor Shower",
    "rarity": "legendary"
  },
  {
    "id": "effect-jackpot",
    "name": "Jackpot Explosion",
    "rarity": "sassy"
  },
  {
    "id": "name-vip",
    "name": "VIP Gold",
    "rarity": "epic"
  },
  {
    "id": "name-rainbow",
    "name": "Prismatic Name",
    "rarity": "epic"
  },
  {
    "id": "name-royal",
    "name": "Royal Diamond",
    "rarity": "legendary"
  },
  {
    "id": "name-electric",
    "name": "Electric Sassy",
    "rarity": "legendary"
  },
  {
    "id": "name-general",
    "name": "GENERAL'S FAVOURITE",
    "rarity": "sassy"
  },
  {"id":"dabber-thunder","name":"Thunder Stamp","rarity":"legendary"},
  {"id":"dabber-sassy","name":"Sassy Detonation","rarity":"sassy"},
  {"id":"theme-police","name":"Blue Line Command","rarity":"legendary"},
  {"id":"theme-casino","name":"Midnight Casino","rarity":"legendary"},
  {"id":"theme-disco","name":"Disco Disaster","rarity":"sassy"},
  {"id":"effect-lightning","name":"Lightning Victory","rarity":"legendary"},
  {"id":"effect-sassy-crown","name":"Sassy Coronation","rarity":"sassy"},
  {"id":"name-menace","name":"BINGO MENACE","rarity":"legendary"},
  {"id":"name-fraud","name":"CERTIFIED FRAUD","rarity":"sassy"},
  {"id":"casino-cardback-neon","name":"Neon Dealer","rarity":"epic"},
  {"id":"casino-cardback-gold","name":"24K Card Back","rarity":"legendary"},
  {"id":"casino-cardback-police","name":"Blue Line Deck","rarity":"legendary"},
  {"id":"casino-cardback-sassy","name":"General's Marked Deck","rarity":"sassy"},
  {"id":"casino-table-velvet","name":"Crimson Velvet","rarity":"epic"},
  {"id":"casino-table-neon","name":"Neon Penthouse","rarity":"legendary"},
  {"id":"casino-table-gold","name":"Sassy High Roller","rarity":"sassy"},
  {"id":"casino-chips-diamond","name":"Diamond Chips","rarity":"epic"},
  {"id":"casino-chips-police","name":"Badge Chips","rarity":"epic"},
  {"id":"casino-chips-sassy","name":"Sassy Sovereigns","rarity":"legendary"},
  {"id":"casino-title-shark","name":"CARD SHARK","rarity":"epic"},
  {"id":"casino-title-highroller","name":"HIGH ROLLER","rarity":"legendary"},
  {"id":"casino-title-nightmare","name":"HOUSE NIGHTMARE","rarity":"legendary"},
  {"id":"casino-title-atm","name":"GENERAL SASSY'S PERSONAL ATM","rarity":"sassy"},
  {"id":"casino-effect-jackpot","name":"Royal Jackpot Burst","rarity":"legendary"},
  {"id":"casino-effect-lightning","name":"Blackjack Thunder","rarity":"legendary"},
  {"id":"casino-effect-sassy","name":"House Has Fallen","rarity":"sassy"}
];

function collectUserPaths(value, targetUid, basePath, updates) {
  if (value === null || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const path = basePath ? `${basePath}/${key}` : key;

    if (key === targetUid) {
      updates[path] = null;
      continue;
    }

    if (child && typeof child === "object" && child.uid === targetUid) {
      updates[path] = null;
      continue;
    }

    collectUserPaths(child, targetUid, path, updates);
  }
}

function weightedPick(items) {
  const rarityGroups = {};

  for (const item of items) {
    (rarityGroups[item.rarity] ||= []).push(item);
  }

  const availableRarities = Object.keys(rarityGroups);
  const total = availableRarities.reduce(
    (sum, rarity) => sum + (RARITY_WEIGHTS[rarity] || 1),
    0
  );

  let roll = Math.random() * total;
  let chosenRarity = availableRarities[0];

  for (const rarity of availableRarities) {
    roll -= RARITY_WEIGHTS[rarity] || 1;
    if (roll <= 0) {
      chosenRarity = rarity;
      break;
    }
  }

  const pool = rarityGroups[chosenRarity];
  return pool[Math.floor(Math.random() * pool.length)];
}


const STORE_CATALOG = [{"id":"avatar-gold-crown","name":"Golden Crown","price":300,"type":"avatar","rarity":"rare"},{"id":"avatar-disco","name":"Disco Ball","price":450,"type":"avatar","rarity":"rare"},{"id":"avatar-fire","name":"Flaming Bingo","price":600,"type":"avatar","rarity":"rare"},{"id":"avatar-diamond","name":"Diamond King","price":900,"type":"avatar","rarity":"epic"},{"id":"avatar-leprechaun","name":"Lucky Leprechaun","price":1000,"type":"avatar","rarity":"epic"},{"id":"avatar-disco-queen","name":"Disco Queen","price":1100,"type":"avatar","rarity":"epic"},{"id":"avatar-skull","name":"Neon Skull","price":1250,"type":"avatar","rarity":"epic"},{"id":"avatar-devil","name":"Bingo Devil","price":1300,"type":"avatar","rarity":"epic"},{"id":"avatar-general","name":"General Sassy","price":1500,"type":"avatar","rarity":"legendary"},{"id":"avatar-jackpot","name":"Jackpot","price":1750,"type":"avatar","rarity":"legendary"},{"id":"avatar-sassy","name":"Legendary General","price":3000,"type":"avatar","rarity":"sassy"},{"id":"dabber-blue","name":"Electric Blue","price":100,"type":"dabber","rarity":"common"},{"id":"dabber-pink","name":"Hot Pink","price":175,"type":"dabber","rarity":"common"},{"id":"dabber-green","name":"Lucky Toxic","price":250,"type":"dabber","rarity":"rare"},{"id":"dabber-gold","name":"Midas Stamp","price":400,"type":"dabber","rarity":"rare"},{"id":"dabber-plasma","name":"Plasma Strike","price":750,"type":"dabber","rarity":"epic"},{"id":"dabber-diamond","name":"Diamond Impact","price":1400,"type":"dabber","rarity":"legendary"},{"id":"theme-neon","name":"Neon Afterdark","price":500,"type":"theme","rarity":"rare"},{"id":"theme-gold","name":"Royal Vault","price":850,"type":"theme","rarity":"epic"},{"id":"theme-fire","name":"Inferno","price":1100,"type":"theme","rarity":"epic"},{"id":"theme-rainbow","name":"Prismatic Riot","price":1500,"type":"theme","rarity":"legendary"},{"id":"theme-galaxy","name":"Sassy Galaxy","price":1800,"type":"theme","rarity":"legendary"},{"id":"theme-obsidian","name":"Black Diamond","price":2400,"type":"theme","rarity":"legendary"},{"id":"theme-general","name":"General's Private Table","price":4000,"type":"theme","rarity":"sassy"},{"id":"confetti-party","name":"Confetti Cannon","price":750,"type":"effect","rarity":"rare"},{"id":"effect-fireworks","name":"Firework Takeover","price":1250,"type":"effect","rarity":"epic"},{"id":"effect-coin-rain","name":"Coin Storm","price":1750,"type":"effect","rarity":"legendary"},{"id":"effect-meteor","name":"Meteor Shower","price":2100,"type":"effect","rarity":"legendary"},{"id":"effect-jackpot","name":"Jackpot Explosion","price":3200,"type":"effect","rarity":"sassy"},{"id":"name-vip","name":"VIP Gold","price":1000,"type":"nameEffect","rarity":"epic"},{"id":"name-rainbow","name":"Prismatic Name","price":1400,"type":"nameEffect","rarity":"epic"},{"id":"name-royal","name":"Royal Diamond","price":2000,"type":"nameEffect","rarity":"legendary"},{"id":"name-electric","name":"Electric Sassy","price":2300,"type":"nameEffect","rarity":"legendary"},{"id":"name-general","name":"GENERAL'S FAVOURITE","price":4500,"type":"nameEffect","rarity":"sassy"},{"id":"dabber-thunder","name":"Thunder Stamp","price":1900,"type":"dabber","rarity":"legendary"},{"id":"dabber-sassy","name":"Sassy Detonation","price":3500,"type":"dabber","rarity":"sassy"},{"id":"theme-police","name":"Blue Line Command","price":1650,"type":"theme","rarity":"legendary"},{"id":"theme-casino","name":"Midnight Casino","price":2100,"type":"theme","rarity":"legendary"},{"id":"theme-disco","name":"Disco Disaster","price":2900,"type":"theme","rarity":"sassy"},{"id":"effect-lightning","name":"Lightning Victory","price":2600,"type":"effect","rarity":"legendary"},{"id":"effect-sassy-crown","name":"Sassy Coronation","price":5000,"type":"effect","rarity":"sassy"},{"id":"name-menace","name":"BINGO MENACE","price":2750,"type":"nameEffect","rarity":"legendary"},{"id":"name-fraud","name":"CERTIFIED FRAUD","price":3250,"type":"nameEffect","rarity":"sassy"},{"id":"casino-cardback-neon","name":"Neon Dealer","price":850,"type":"cardBack","rarity":"epic"},{"id":"casino-cardback-gold","name":"24K Card Back","price":1250,"type":"cardBack","rarity":"legendary"},{"id":"casino-cardback-police","name":"Blue Line Deck","price":1450,"type":"cardBack","rarity":"legendary"},{"id":"casino-cardback-sassy","name":"General's Marked Deck","price":3000,"type":"cardBack","rarity":"sassy"},{"id":"casino-table-velvet","name":"Crimson Velvet","price":1200,"type":"tableSkin","rarity":"epic"},{"id":"casino-table-neon","name":"Neon Penthouse","price":1850,"type":"tableSkin","rarity":"legendary"},{"id":"casino-table-gold","name":"Sassy High Roller","price":3500,"type":"tableSkin","rarity":"sassy"},{"id":"casino-chips-diamond","name":"Diamond Chips","price":900,"type":"chipSet","rarity":"epic"},{"id":"casino-chips-police","name":"Badge Chips","price":1100,"type":"chipSet","rarity":"epic"},{"id":"casino-chips-sassy","name":"Sassy Sovereigns","price":2400,"type":"chipSet","rarity":"legendary"},{"id":"casino-title-shark","name":"CARD SHARK","price":1250,"type":"casinoTitle","rarity":"epic"},{"id":"casino-title-highroller","name":"HIGH ROLLER","price":2200,"type":"casinoTitle","rarity":"legendary"},{"id":"casino-title-nightmare","name":"HOUSE NIGHTMARE","price":3200,"type":"casinoTitle","rarity":"legendary"},{"id":"casino-title-atm","name":"GENERAL SASSY'S PERSONAL ATM","price":4500,"type":"casinoTitle","rarity":"sassy"},{"id":"casino-effect-jackpot","name":"Royal Jackpot Burst","price":1800,"type":"casinoEffect","rarity":"legendary"},{"id":"casino-effect-lightning","name":"Blackjack Thunder","price":2100,"type":"casinoEffect","rarity":"legendary"},{"id":"casino-effect-sassy","name":"House Has Fallen","price":4200,"type":"casinoEffect","rarity":"sassy"}];
function utcDayNumber(){ return Math.floor(Date.now()/86400000); }
function currentDealId(){ const paid=STORE_CATALOG.filter(x=>x.price>0); return paid[utcDayNumber()%paid.length]?.id; }
function storePrice(item){ return item.id===currentDealId()?Math.max(1,Math.floor(item.price*0.75)):item.price; }

exports.buyStoreItem = onCall({ region:"europe-west1", maxInstances:3, timeoutSeconds:30 }, async request=>{
 if(!request.auth) throw new HttpsError("unauthenticated","You must be signed in.");
 const item=STORE_CATALOG.find(x=>x.id===request.data?.itemId); if(!item) throw new HttpsError("not-found","Unknown store item.");
 const price=storePrice(item), uid=request.auth.uid, {db}=getAdminServices(), pr=db.ref(`v2/profiles/${uid}`); let reason="";
 const tx=await pr.transaction(cur=>{if(!cur){reason="PROFILE";return;}cur.inventory=cur.inventory||{};if(cur.inventory[item.id]){reason="OWNED";return cur;}if(Number(cur.coins||0)<price){reason="COINS";return;}cur.coins=Number(cur.coins||0)-price;cur.inventory[item.id]=Date.now();cur.storeStats=cur.storeStats||{};cur.storeStats.totalSpent=Number(cur.storeStats.totalSpent||0)+price;cur.updatedAt=Date.now();return cur;});
 if(!tx.committed) throw new HttpsError("failed-precondition",reason==="COINS"?"Not enough Sassy Coins.":"Purchase could not complete.");
 await db.ref(`v2/transactions/${uid}`).push({amount:-price,reason:`Bought ${item.name}`,type:"purchase",itemId:item.id,createdAt:Date.now(),createdBy:"buyStoreItem"});
 return {ok:true,itemId:item.id,pricePaid:price,deal:item.id===currentDealId()};
});

exports.giftStoreItem = onCall({ region:"europe-west1", maxInstances:3, timeoutSeconds:30 }, async request=>{
 if(!request.auth) throw new HttpsError("unauthenticated","You must be signed in.");
 const item=STORE_CATALOG.find(x=>x.id===request.data?.itemId), username=String(request.data?.username||"").trim().toLowerCase(); if(!item||!username) throw new HttpsError("invalid-argument","Choose an item and username.");
 const {db}=getAdminServices(), all=(await db.ref("v2/profiles").get()).val()||{}, hit=Object.entries(all).find(([id,x])=>id!==request.auth.uid&&String(x?.username||"").trim().toLowerCase()===username); if(!hit) throw new HttpsError("not-found","Player not found.");
 const [toUid,toProfile]=hit; if(toProfile.inventory?.[item.id]) throw new HttpsError("already-exists","They already own that item."); const price=storePrice(item), fromRef=db.ref(`v2/profiles/${request.auth.uid}`);
 const debit=await fromRef.transaction(cur=>{if(!cur||Number(cur.coins||0)<price)return;cur.coins=Number(cur.coins||0)-price;cur.storeStats=cur.storeStats||{};cur.storeStats.totalSpent=Number(cur.storeStats.totalSpent||0)+price;return cur;}); if(!debit.committed) throw new HttpsError("failed-precondition","Not enough Sassy Coins.");
 await db.ref(`v2/profiles/${toUid}/inventory/${item.id}`).set(Date.now()); await db.ref(`v2/transactions/${request.auth.uid}`).push({amount:-price,reason:`Gifted ${item.name} to ${toProfile.username}`,type:"gift",itemId:item.id,createdAt:Date.now()}); return {ok:true,recipient:toProfile.username,pricePaid:price};
});

exports.openSassyCrate = onCall(
  { region:"europe-west1", maxInstances:3, timeoutSeconds:30 },
  async request => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const uid = request.auth.uid;
    const { db } = getAdminServices();
    const profileRef = db.ref(`v2/profiles/${uid}`);

    console.log("Sassy Crate request", {
      uid,
      profilePath:`v2/profiles/${uid}`,
      databaseURL:DATABASE_URL
    });

    try {
      // IMPORTANT:
      // RTDB transactions can invoke their update callback with null before
      // the server value has arrived. Read the real profile first so that
      // temporary local null does not become a fake "Profile not found".
      const initialSnap = await profileRef.get();

      if (!initialSnap.exists()) {
        console.error("Profile genuinely missing before crate transaction", {
          uid,
          databaseURL:DATABASE_URL
        });

        throw new HttpsError(
          "not-found",
          "Profile not found."
        );
      }

      const initialProfile = initialSnap.val();

      let awardedReward = null;
      let abortReason = "";

      const tx = await profileRef.transaction(current => {
        abortReason = "";
        awardedReward = null;

        // Firebase may give null on the first local transaction pass.
        // Use the profile we just read instead of aborting immediately.
        if (current === null || current === undefined) {
          current = structuredClone(initialProfile);
        }

        if (!current || typeof current !== "object") {
          abortReason = "PROFILE_INVALID";
          return;
        }

        const coins = Number(current.coins || 0);
        const inventory = current.inventory || {};

        const available = CRATE_CATALOG.filter(
          item => inventory[item.id] == null
        );

        if (!available.length) {
          abortReason = "COLLECTION_COMPLETE";
          return;
        }

        if (coins < CRATE_PRICE) {
          abortReason = "NOT_ENOUGH_COINS";
          return;
        }

        // Choose from the CURRENT transaction state.
        // If Firebase retries due to a concurrent profile update, this is
        // recalculated from the newest inventory and cannot duplicate an item.
        const sinceLegendary = Number(current.storeStats?.cratesSinceLegendary || 0);
        const pityPool = sinceLegendary >= 9 ? available.filter(x => x.rarity === "legendary" || x.rarity === "sassy") : [];
        const reward = weightedPick(pityPool.length ? pityPool : available);

        if (!reward || !reward.id) {
          abortReason = "NO_REWARD";
          return;
        }

        awardedReward = reward;

        current.inventory = current.inventory || {};
        current.achievements = current.achievements || {};

        current.coins = coins - CRATE_PRICE;
        current.inventory[reward.id] = Date.now();
        current.updatedAt = Date.now();
        current.storeStats = current.storeStats || {};
        current.storeStats.cratesOpened = Number(current.storeStats.cratesOpened || 0) + 1;
        current.storeStats.cratesSinceLegendary = (reward.rarity === "legendary" || reward.rarity === "sassy") ? 0 : Number(current.storeStats.cratesSinceLegendary || 0) + 1;

        if (!current.achievements["crate-first"]) {
          current.achievements["crate-first"] = Date.now();
        }

        if (
          reward.rarity === "legendary" ||
          reward.rarity === "sassy"
        ) {
          if (!current.achievements["crate-legendary"]) {
            current.achievements["crate-legendary"] = Date.now();
          }
        }

        return current;
      });

      if (!tx.committed) {
        console.warn("Sassy Crate transaction did not commit", {
          uid,
          abortReason
        });

        if (abortReason === "COLLECTION_COMPLETE") {
          return {
            ok:true,
            complete:true
          };
        }

        if (abortReason === "NOT_ENOUGH_COINS") {
          throw new HttpsError(
            "failed-precondition",
            "Not enough Sassy Coins."
          );
        }

        throw new HttpsError(
          "aborted",
          "Sassy Crate transaction could not complete."
        );
      }

      const reward = awardedReward;

      if (!reward) {
        console.error("Crate committed without reward", {uid});

        throw new HttpsError(
          "internal",
          "Crate completed without a reward."
        );
      }

      // Audit history is deliberately non-fatal after the atomic profile
      // transaction has completed.
      try {
        await db.ref(`v2/transactions/${uid}`).push({
          amount:-CRATE_PRICE,
          reason:`Sassy Crate — ${reward.name}`,
          type:"crate",
          itemId:reward.id,
          rarity:reward.rarity,
          createdAt:Date.now(),
          createdBy:"openSassyCrate"
        });
      } catch (historyError) {
        console.error("Crate history logging failed", historyError);
      }

      console.log("Sassy Crate success", {
        uid,
        itemId:reward.id,
        rarity:reward.rarity,
        remainingCoins:Number(tx.snapshot.val()?.coins || 0)
      });

      return {
        ok:true,
        complete:false,
        itemId:reward.id,
        rarity:reward.rarity,
        remainingCoins:Number(tx.snapshot.val()?.coins || 0)
      };

    } catch (error) {
      console.error("openSassyCrate failed", {
        code:error?.code,
        message:error?.message,
        stack:error?.stack
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error?.message || "Sassy Crate failed unexpectedly."
      );
    }
  }
);

// deleteBingoUser works for BOTH online and offline accounts because it
// operates directly on Firebase Authentication + V2 data by UID.
exports.deleteBingoUser = onCall(
  { region:"europe-west1", maxInstances:3, timeoutSeconds:60 },
  async request => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const callerUid = request.auth.uid;
    const { auth, db } = getAdminServices();

    const targetUid = String(request.data?.targetUid || "").trim();

    if (!targetUid) {
      throw new HttpsError("invalid-argument", "Missing target user.");
    }

    if (targetUid === callerUid) {
      throw new HttpsError("failed-precondition", "You cannot delete your own admin account here.");
    }

    const adminSnapshot = await db.ref(`v2/admins/${callerUid}`).get();

    if (adminSnapshot.val() !== true) {
      throw new HttpsError("permission-denied", "Admin access required.");
    }

    const targetAdminSnapshot = await db.ref(`v2/admins/${targetUid}`).get();

    if (targetAdminSnapshot.val() === true) {
      throw new HttpsError("failed-precondition", "Admin accounts cannot be deleted from the Host panel.");
    }

    try {
      await auth.getUser(targetUid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.error("Unable to check Firebase Authentication user:", error);
        throw new HttpsError("internal", "Unable to verify the selected Firebase account.");
      }
    }

    const updates = {
      [`v2/profiles/${targetUid}`]: null,
      [`v2/publicProfiles/${targetUid}`]: null,
      [`v2/lobby/${targetUid}`]: null,
      [`v2/gamePlayers/${targetUid}`]: null,
      [`v2/kicks/${targetUid}`]: null,
      [`v2/transactions/${targetUid}`]: null,
      [`v2/rewards/${targetUid}`]: null,
      [`v2/purchaseRequests/${targetUid}`]: null,
      [`v2/casino/blackjack/${targetUid}`]: null,
      [`v2/casino/higherLower/${targetUid}`]: null
    };

    const [claimsSnapshot, winnersSnapshot] = await Promise.all([
      db.ref("v2/claims").get(),
      db.ref("v2/verifiedWinners").get()
    ]);

    collectUserPaths(claimsSnapshot.val(), targetUid, "v2/claims", updates);
    collectUserPaths(winnersSnapshot.val(), targetUid, "v2/verifiedWinners", updates);

    await db.ref().update(updates);

    try {
      await auth.deleteUser(targetUid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.error("Authentication deletion failed:", error);
        throw new HttpsError("internal", "Bingo data was removed, but the Firebase login could not be deleted.");
      }
    }

    return { ok:true, targetUid };
  }
);

// ============================================================================
// GENERAL SASSY GAMES V3 — SERVER-AUTHORITATIVE SASSY CASINO
// Sassy Coins are fictional closed-loop game currency with no cash value.
// ============================================================================
const crypto = require("crypto");
const CASINO_BETS = new Set([10,25,50,100,250,500]);
const CASINO_STARTING_HOUSE = 250000;

function requireCasinoBet(value){
  const bet = Math.floor(Number(value));
  if(!CASINO_BETS.has(bet)) throw new HttpsError("invalid-argument","Choose a valid Sassy Coin stake.");
  return bet;
}
function casinoNow(){ return Date.now(); }
function casinoId(prefix){ return `${prefix}_${crypto.randomUUID()}`; }
function randomInt(max){ return crypto.randomInt(0,max); }
function shuffleCasinoDeck(){
  const suits=["S","H","D","C"],ranks=["2","3","4","5","6","7","8","9","10","J","Q","K","A"],deck=[];
  for(const s of suits)for(const r of ranks)deck.push(`${r}${s}`);
  for(let i=deck.length-1;i>0;i--){const j=randomInt(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
function rankValue(code){
  const r=String(code).replace(/[SHDC]$/,'');
  if(r==="A")return 11;if(["K","Q","J"].includes(r))return 10;return Number(r)||0;
}
function handValue(cards){
  let total=cards.reduce((n,c)=>n+rankValue(c),0),aces=cards.filter(c=>String(c).startsWith("A")).length;
  while(total>21&&aces>0){total-=10;aces--;}
  return total;
}
async function casinoProfile(uid){
  const {db}=getAdminServices();const snap=await db.ref(`v2/profiles/${uid}`).get();
  if(!snap.exists())throw new HttpsError("not-found","Player profile not found.");return snap.val();
}
async function debitCasino(uid,amount,debitId,{countRound=true}={}){
  const {db}=getAdminServices();let reason="",charged=false;
  const tx=await db.ref(`v2/profiles/${uid}`).transaction(cur=>{
    if(!cur){reason="PROFILE";return;}
    cur.casinoDebits=cur.casinoDebits||{};if(cur.casinoDebits[debitId])return cur;
    if(Number(cur.coins||0)<amount){reason="COINS";return;}
    cur.coins=Number(cur.coins||0)-amount;cur.casinoDebits[debitId]=casinoNow();charged=true;
    cur.casinoStats=cur.casinoStats||{};cur.casinoStats.wagered=Number(cur.casinoStats.wagered||0)+amount;if(countRound)cur.casinoStats.rounds=Number(cur.casinoStats.rounds||0)+1;
    cur.achievements=cur.achievements||{};cur.achievements["casino-first"]=cur.achievements["casino-first"]||casinoNow();
    if(cur.casinoStats.wagered>=5000)cur.achievements["casino-wager-5000"]=cur.achievements["casino-wager-5000"]||casinoNow();
    cur.updatedAt=casinoNow();return cur;
  });
  if(!tx.committed)throw new HttpsError("failed-precondition",reason==="COINS"?"Not enough Sassy Coins.":"Casino wager could not be placed.");
  return charged;
}
async function refundCasinoDebit(uid,amount,debitId,{countRound=true}={}){
  const {db}=getAdminServices();
  await db.ref(`v2/profiles/${uid}`).transaction(cur=>{if(!cur?.casinoDebits?.[debitId])return cur;cur.coins=Number(cur.coins||0)+amount;delete cur.casinoDebits[debitId];cur.casinoStats=cur.casinoStats||{};cur.casinoStats.wagered=Math.max(0,Number(cur.casinoStats.wagered||0)-amount);if(countRound)cur.casinoStats.rounds=Math.max(0,Number(cur.casinoStats.rounds||0)-1);return cur;});
}
async function houseAdjust(delta,{wagered=0,paid=0,round=0}={}){
  const {db}=getAdminServices();
  try{await db.ref("v2/casino/publicStats").transaction(cur=>{cur=cur||{};cur.houseBalance=Number(cur.houseBalance??CASINO_STARTING_HOUSE)+delta;cur.houseProfit=Number(cur.houseProfit||0)+delta;cur.totalWagered=Math.max(0,Number(cur.totalWagered||0)+wagered);cur.totalPaidOut=Math.max(0,Number(cur.totalPaidOut||0)+paid);cur.rounds=Math.max(0,Number(cur.rounds||0)+round);if(paid>Number(cur.biggestPayout||0))cur.biggestPayout=paid;cur.updatedAt=casinoNow();return cur;});}catch(error){console.error("Casino house accounting update failed",{delta,wagered,paid,round,error});}
}
async function settleCasino(uid,payout,settlementId,{achievement=null}={}){
  if(payout<=0)return false;const {db}=getAdminServices();let credited=false;
  const tx=await db.ref(`v2/profiles/${uid}`).transaction(cur=>{if(!cur)return;cur.casinoSettlements=cur.casinoSettlements||{};if(cur.casinoSettlements[settlementId])return cur;cur.coins=Number(cur.coins||0)+payout;cur.casinoSettlements[settlementId]=casinoNow();cur.casinoStats=cur.casinoStats||{};cur.casinoStats.paidOut=Number(cur.casinoStats.paidOut||0)+payout;if(achievement){cur.achievements=cur.achievements||{};cur.achievements[achievement]=cur.achievements[achievement]||casinoNow();}cur.updatedAt=casinoNow();credited=true;return cur;});
  if(tx.committed&&credited)await houseAdjust(-payout,{paid:payout});return credited;
}
async function recordCasinoLedger(uid,data){
  try{const {db}=getAdminServices();const p=await casinoProfile(uid);await db.ref("v2/casino/ledger").push({...data,uid,username:p.username||"Player",createdAt:casinoNow()});}catch(error){console.error("Casino ledger write failed",{uid,data,error});}
}
function blackjackPublic(s){
  const resolved=s.state!=="active";return {state:s.state,outcome:s.outcome||null,bet:s.bet,playerCards:s.playerCards||[],dealerCards:resolved?(s.dealerCards||[]):[(s.dealerCards||[])[0],"BACK"],dealerHidden:!resolved,playerScore:handValue(s.playerCards||[]),dealerScore:resolved?handValue(s.dealerCards||[]):null,canDouble:s.state==="active"&&(s.playerCards||[]).length===2&&!s.doubled,message:s.message||""};
}
function resolveDealer(session){while(handValue(session.dealerCards)<17)session.dealerCards.push(session.deck.shift());const p=handValue(session.playerCards),d=handValue(session.dealerCards);if(d>21||p>d){session.outcome="win";session.payout=session.bet*2;session.message=d>21?`General Sassy busts on ${d}. You win ${session.payout} coins.`:`${p} beats ${d}. You win ${session.payout} coins.`;}else if(p===d){session.outcome="push";session.payout=session.bet;session.message=`Push on ${p}. Your ${session.bet} coins return.`;}else{session.outcome="loss";session.payout=0;session.message=`General Sassy wins ${d} to ${p}. The House thanks you.`;}session.state="resolved";return session;}

exports.casinoBlackjackStart=onCall({region:"europe-west1",maxInstances:10,timeoutSeconds:30},async request=>{
  if(!request.auth)throw new HttpsError("unauthenticated","Sign in first.");const uid=request.auth.uid,bet=requireCasinoBet(request.data?.bet),{db}=getAdminServices(),sessionRef=db.ref(`v2/casino/blackjack/${uid}`),deck=shuffleCasinoDeck(),id=casinoId("bj");
  const playerCards=[deck.shift(),deck.shift()],dealerCards=[deck.shift(),deck.shift()];let session={id,state:"active",bet,deck,playerCards,dealerCards,doubled:false,createdAt:casinoNow(),message:"Your move."};
  const p=handValue(playerCards),d=handValue(dealerCards);if(p===21||d===21){session.state="resolved";if(p===21&&d===21){session.outcome="push";session.payout=bet;session.message="Double Blackjack. Push — stake returned.";}else if(p===21){session.outcome="win";session.payout=Math.floor(bet*2.5);session.message=`Natural Blackjack! ${session.payout} coins returned.`;}else{session.outcome="loss";session.payout=0;session.message="General Sassy has Blackjack. Appalling timing.";}}
  let busy=false;const claim=await sessionRef.transaction(cur=>{if(cur?.state==="active"){busy=true;return;}return session;});if(!claim.committed)throw new HttpsError("failed-precondition",busy?"Finish your current Blackjack hand first.":"Could not open the table.");
  try{await debitCasino(uid,bet,id);await houseAdjust(bet,{wagered:bet,round:1});if(session.state==="resolved"){await settleCasino(uid,session.payout,`${id}_settle`,{achievement:session.outcome==="win"?"casino-blackjack":null});await recordCasinoLedger(uid,{game:"blackjack",bet,payout:session.payout,outcome:session.outcome});}return blackjackPublic(session);}catch(e){await sessionRef.remove();await refundCasinoDebit(uid,bet,id);throw e;}
});

exports.casinoBlackjackAction=onCall({region:"europe-west1",maxInstances:10,timeoutSeconds:30},async request=>{
  if(!request.auth)throw new HttpsError("unauthenticated","Sign in first.");const uid=request.auth.uid,action=String(request.data?.action||"");if(!["hit","stand","double"].includes(action))throw new HttpsError("invalid-argument","Unknown Blackjack action.");const {db}=getAdminServices(),r=db.ref(`v2/casino/blackjack/${uid}`),snap=await r.get();if(!snap.exists()||snap.val().state!=="active")throw new HttpsError("failed-precondition","No active Blackjack hand.");const before=snap.val();
  if(action==="double"){if((before.playerCards||[]).length!==2||before.doubled)throw new HttpsError("failed-precondition","Double is only available on your opening hand.");const doubleCharged=await debitCasino(uid,before.bet,`${before.id}_double`,{countRound:false});if(!doubleCharged)throw new HttpsError("failed-precondition","Double already processed.");await houseAdjust(before.bet,{wagered:before.bet});}
  let abort="";const tx=await r.transaction(s=>{if(!s||s.state!=="active"){abort="DONE";return;}if(action==="double"&&((s.playerCards||[]).length!==2||s.doubled)){abort="DOUBLE";return;}if(action==="hit"||action==="double"){s.playerCards=s.playerCards||[];s.deck=s.deck||[];s.playerCards.push(s.deck.shift());if(action==="double"){s.bet=Number(s.bet)*2;s.doubled=true;}const p=handValue(s.playerCards);if(p>21){s.state="resolved";s.outcome="loss";s.payout=0;s.message=`Bust on ${p}. General Sassy accepts your donation.`;}else if(p===21||action==="double")resolveDealer(s);else s.message=`${p}. Hit or stand?`;}else resolveDealer(s);s.updatedAt=casinoNow();return s;});
  if(!tx.committed){if(action==="double"){await refundCasinoDebit(uid,before.bet,`${before.id}_double`,{countRound:false});await houseAdjust(-before.bet,{wagered:-before.bet});}throw new HttpsError("failed-precondition",abort==="DOUBLE"?"Double is no longer available.":"That hand has already finished.");}
  const s=tx.snapshot.val();if(s.state==="resolved"){await settleCasino(uid,Number(s.payout||0),`${s.id}_settle`,{achievement:s.outcome==="win"?"casino-blackjack":null});await recordCasinoLedger(uid,{game:"blackjack",bet:s.bet,payout:s.payout||0,outcome:s.outcome});}return blackjackPublic(s);
});

function cardRankHigh(code){const r=String(code).replace(/[SHDC]$/,'');return r==="A"?14:r==="K"?13:r==="Q"?12:r==="J"?11:Number(r);}
exports.casinoHigherLowerStart=onCall({region:"europe-west1",maxInstances:10,timeoutSeconds:30},async request=>{
  if(!request.auth)throw new HttpsError("unauthenticated","Sign in first.");const uid=request.auth.uid,bet=requireCasinoBet(request.data?.bet),{db}=getAdminServices(),r=db.ref(`v2/casino/higherLower/${uid}`),deck=shuffleCasinoDeck(),id=casinoId("hl"),session={id,state:"active",bet,currentCard:deck.shift(),deck,createdAt:casinoNow(),message:"Higher or lower? Ace is high."};let busy=false;const tx=await r.transaction(cur=>{if(cur?.state==="active"){busy=true;return;}return session;});if(!tx.committed)throw new HttpsError("failed-precondition",busy?"Finish your current Higher / Lower guess first.":"Could not start.");try{await debitCasino(uid,bet,id);await houseAdjust(bet,{wagered:bet,round:1});return session;}catch(e){await r.remove();await refundCasinoDebit(uid,bet,id);throw e;}
});
exports.casinoHigherLowerGuess=onCall({region:"europe-west1",maxInstances:10,timeoutSeconds:30},async request=>{
  if(!request.auth)throw new HttpsError("unauthenticated","Sign in first.");const uid=request.auth.uid,guess=String(request.data?.guess||"");if(!["higher","lower"].includes(guess))throw new HttpsError("invalid-argument","Choose higher or lower.");const {db}=getAdminServices(),r=db.ref(`v2/casino/higherLower/${uid}`);let abort=false;const tx=await r.transaction(s=>{if(!s||s.state!=="active"){abort=true;return;}const next=s.deck.shift(),a=cardRankHigh(s.currentCard),b=cardRankHigh(next);s.nextCard=next;s.state="resolved";if(a===b){s.outcome="push";s.payout=s.bet;s.message=`Same rank. Push — ${s.bet} coins returned.`;}else{const correct=(guess==="higher"&&b>a)||(guess==="lower"&&b<a);s.outcome=correct?"win":"loss";s.payout=correct?s.bet*2:0;s.message=correct?`Correct! ${s.payout} coins returned.`:"Wrong. The House keeps the stake.";}s.updatedAt=casinoNow();return s;});if(!tx.committed)throw new HttpsError("failed-precondition",abort?"No active Higher / Lower game.":"Could not resolve guess.");const s=tx.snapshot.val();await settleCasino(uid,Number(s.payout||0),`${s.id}_settle`);await recordCasinoLedger(uid,{game:"higher-lower",bet:s.bet,payout:s.payout||0,outcome:s.outcome});return s;
});

const SLOT_SYMBOLS=[{s:"🍒",w:30,m:4},{s:"🔔",w:22,m:7},{s:"💎",w:16,m:12},{s:"7️⃣",w:10,m:25},{s:"👑",w:6,m:50},{s:"🎖️",w:3,m:125}];
function slotSymbol(){const total=SLOT_SYMBOLS.reduce((n,x)=>n+x.w,0);let roll=randomInt(total);for(const x of SLOT_SYMBOLS){if(roll<x.w)return x.s;roll-=x.w;}return "🍒";}
exports.casinoSlotsSpin=onCall({region:"europe-west1",maxInstances:20,timeoutSeconds:30},async request=>{
  if(!request.auth)throw new HttpsError("unauthenticated","Sign in first.");const uid=request.auth.uid,bet=requireCasinoBet(request.data?.bet),id=casinoId("slot"),reels=[slotSymbol(),slotSymbol(),slotSymbol()];await debitCasino(uid,bet,id);await houseAdjust(bet,{wagered:bet,round:1});let multiplier=0;if(reels[0]===reels[1]&&reels[1]===reels[2])multiplier=SLOT_SYMBOLS.find(x=>x.s===reels[0])?.m||0;else if(reels[0]===reels[1]||reels[1]===reels[2]||reels[0]===reels[2])multiplier=1;const payout=bet*multiplier,outcome=payout>bet?"win":payout===bet?"push":"loss";await settleCasino(uid,payout,`${id}_settle`,{achievement:outcome==="win"?"casino-slots":null});const message=outcome==="win"?`${multiplier}× WIN — ${payout.toLocaleString("en-GB")} coins!`:outcome==="push"?"Pair! Your stake comes back.":"No match. General Sassy pockets the stake.";await recordCasinoLedger(uid,{game:"slots",bet,payout,outcome,reels:reels.join(" ")});return {ok:true,bet,reels,multiplier,payout,outcome,message};
});

exports.casinoAdminAdjustHouse=onCall({region:"europe-west1",maxInstances:3,timeoutSeconds:30},async request=>{
  if(!request.auth)throw new HttpsError("unauthenticated","Sign in first.");const {db}=getAdminServices();if((await db.ref(`v2/admins/${request.auth.uid}`).get()).val()!==true)throw new HttpsError("permission-denied","Admin access required.");const amount=Math.trunc(Number(request.data?.amount||0));if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>10000000)throw new HttpsError("invalid-argument","Choose a valid House adjustment.");let balance=0;await db.ref("v2/casino/publicStats").transaction(cur=>{cur=cur||{};balance=Math.max(0,Number(cur.houseBalance??CASINO_STARTING_HOUSE)+amount);cur.houseBalance=balance;cur.updatedAt=casinoNow();return cur;});await db.ref("v2/casino/adminLedger").push({adminUid:request.auth.uid,amount,createdAt:casinoNow()});return {ok:true,houseBalance:balance};
});
