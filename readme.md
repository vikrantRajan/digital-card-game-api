## DIGITAL CARD GAME API

- run `npm i`

- To start servers run the command: `npm start`

- Make sure you have a `.env` file in your root directory with the neccessary variables

- BELOW ARE A LIST OF MY CONTRIBUTIONS TO THIS PROJECT (NODE.JS, EXPRESS.JS, MONGO DB)

###### SETS
1. GET /sets (USER)
return an array of all available sets in the app, with their properties (id, tid, title, image, desc, price). (tid would be the text_id we
discussed, while id is the mongo-generated id).

2. GET /sets/:setId (USER)
return the information about 1 set, it should also include an extra array of all the available cards in that set. (even if that array if not
directly in the set schema), including card info like image, title, rarity. Would be cool if :setId is a representative string (tid) instead of a
ObjectId

3. POST /sets/add (MANAGER)
Add a new set to the database (tid, title, image, desc, price). id (MongoID) should be automatic. tid (text id) should be unique.

4. PATCH /sets/:setId (MANAGER)
Edit the information about a set (title, image, description and price). No need to edit Ids. Undefined properties should not be edited.

5. DELETE /sets/:setId (ADMIN)
Delete a set from the DB. We probably want to delete all cards from that set too.
CARDS

###### CARDS
1. GET /cards (USER)
return an array of all available cards in the app, with their properties (id, tid, title, image, set, rarity) rarity could be an integer (ex:
0=common, 1=uncommon, 2=rare, 3=extra rare).

2. GET /cards/:cardId (USER)
return the information about 1 card, we may want to populate the set attached to this card so we can display the set’s title too when
showing card info. Would be cool if :cardId is a representative string (tid) instead of a ObjectId.

3. POST /cards/add (MANAGER)
Add a new card to the database. (tid, title, image, set, rarity). id (MongoID) should be automatic. tid (text id) should be unique.

4. PATCH /cards/:cardId (MANAGER)
Edit the information about a card (title, image, set and rarity). No need to edit ids. Undefined properties should not be edited.

5. DELETE /cards/:cardId (ADMIN)
Delete a card from the DB.

###### USERS
1. POST /users/addcard/:userId (ADMIN or SAME MANAGER)
The request body should have a tid and quantity, and it will add those cards to this user’s collection. Would be cool if this function
support two type of body: either a single card, or an array of cards, so we don’t need to call this many times. Also make sure that the
card exists before adding it.


2. POST /users/addset/:userId (ADMIN or SAME MANAGER)
The request body should have a tid and quantity, and it will add those unopened sets to this user collection. Would be cool if this
function support two type of body: either a single set, or an array of sets, so we don’t need to call this many times. Also make sure that
the set exists before adding it. 

3. POST /users/openset/:userId (ADMIN or SAME USER)
Open a user’s owned set, and gain random cards associated with it.
The request body should have the setId. Only 1 set is opened at a time so no need quantity. It should then return an array of the cards
gained and the api automatically add those cards to the user’s collection (and also remove the set). Make sure that the user has at least
1 quantity of the set before opening it. Cards should be given randomly based on their rarity (ex: common 70%, uncommon 20%, rare
10%, I will ask the client for the exact values, we should be able to change those value easily in the code).

4. GET /users/cards/:userId (MANAGER or SAME USER)
Return a list of cards owned by the user, including quantities. We probably want to populate the cards so we have info about them, not
just the ids.

5. GET /users/sets/:userId (MANAGER or SAME USER)
Return a list of unopened sets owned by the user, including quantities. We probably want to populate the sets so we have info about
them, not just the ids.

6. POST /users/givecard/:userId (ADMIN or SAME USER)
This will give a card owned by this user to another user. (so remove from userId collection and give it to targetUserId) The post body
should have the card tid, the quantity, and the target user you give the card to. Would be cool if this function also supports either single
card or arrays.

7. POST /users/giveset/:userId (ADMIN or SAME USER)
This will give a unopened set owned by this user to another user. (so remove from userId collection and give it to targetUserId). The
post body should have the set tid, the quantity, and the target user you give the card to. Would be cool if this function also supports
either single set or arrays.


###### Storage Tasks (MANAGER)
A. Upload (POST)
B. Delete (DELETE)

###### IAP validation (USER)
- POST request for validating the receipt of an IAP with (https://github.com/voltrue2/in-app-purchase).
A. Receipt validation,
B. Add the purchased items to user in DB (set and quantity).
C. Ensure IAP doesn’t allow a reciept to be reused.

###### Activity log 
- Activity log schema is: { type, user, datetime, data }
- ‘user’ is the current logged in username ‘type’ is either "addcard", "addset", "givecard", "giveset", "openset", "register". 
- data is an object where you can save any info about the activity, like the cards/sets involved or the targetUser for give
- Save activity for the following user functions:
1. addusercard
2. adduserset
3. givecard
4. giveset
5. openset
6. register

- Get Method for Activity Log: GET request to retrieve activity by type or by username. (MANAGER)