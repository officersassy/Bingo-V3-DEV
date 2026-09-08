GENERAL SASSY GAMES V3.0.0
===========================

Major platform upgrade built on the working V2.5.1 Bingo release.

NEW GAME HUB
- Login now lands on hub.html.
- Bingo remains its own working module.
- New Sassy Casino is separate from Bingo.
- Same Firebase account, profile, inventory and Sassy Coin balance across games.

SASSY CASINO
- Blackjack: server-authoritative deck, Hit / Stand / Double, dealer stands on 17,
  natural Blackjack pays 3:2, push returns stake.
- Higher / Lower: server-controlled cards, Ace high, correct guess returns 2x,
  equal rank is a push.
- Sassy Slots: server-controlled weighted reels, six symbols, pair returns stake,
  triple payouts from 4x to 125x.
- Allowed stakes: 10 / 25 / 50 / 100 / 250 / 500 Sassy Coins.
- All wager deductions and payouts happen in Cloud Functions, not browser JS.
- House vault, total wagered, paid out, house profit, rounds and biggest payout tracked.
- Admin Casino Control page with live ledger and House bankroll adjustment.

EMPORIUM
- 17 new Casino cosmetics:
  card backs, Blackjack table skins, chip sets, casino titles and casino win effects.
- Existing purchase, gifting, daily deal, wishlist and Sassy Crate systems preserved.
- Casino cosmetics are inventory-validated by Firebase Rules before equip.

ACHIEVEMENTS
- First casino wager
- Blackjack win
- Slots win
- 5,000 Sassy Coins wagered

IMPORTANT
Sassy Coins are closed-loop fictional game currency only. They have no cash value,
cannot be bought for real money, cannot be withdrawn and are not exchangeable for
real-world prizes.

DEPLOYMENT
1. Replace/upload website files to GitHub Pages.
2. Publish FIREBASE-RULES-FINAL.json in Firebase Realtime Database Rules.
3. From this folder run:
     cd functions
     npm.cmd install
     cd ..
     node -e "require('./functions/index.js'); console.log('FUNCTION LOADED OK')"
     firebase.cmd deploy --only functions
4. Ctrl+F5 the live site.
5. Test with a small 10-coin wager first.
