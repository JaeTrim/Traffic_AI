# Traffic_AI
[Previous Project](https://vtechworks.lib.vt.edu/items/bd9772e1-81d0-48af-89fe-31c788c01ec5)

*A new terminal must be opened when running each framework (MongoDB, FastAPI, Next.js)

**Changes required**  
- Change compose.yml file in MongoDB directory  
```
services:
 mongodb-community-server:
   container_name: mongodb
   volumes:
     - ./data/db:/data/db
   ports:
     - 27017:27017
   image: mongodb/mongodb-community-server:latest
   pull_policy: if_not_present
```
Execute command in MongoDB directory  
- mkdir -p data/db

---

**Setting up FastAPI**  
- cd FastAPI
- python3.10 -m venv venv
- source ./venv/bin/activate
- pip3 install -r requirements.txt

**Setting up Next.js**  
First, ensure you are in the traffic-ai root directory, then run this command to start the
frontend website:
- npm install

**Running MongoDB**  
First, ensure you are in the MongoDB directory:  
- cd MongoDB   

Then, start it up by running this command:  
- docker compose up

**Running FastAPI**
- uvicorn app:app --reload

**Running Next.js**
- npm run dev

**Adding an admin user**
- cd MongoDB
- docker ps (to see current containers running)
- docker exec -it mongodb mongosh (“mongodb” can be different based on name found under docker ps)  
- show dbs
- use trafficai
- show collections
- db.users.find()
- db.users.updateOne( { username: "yourUsername" }, { $set: { role: "admin" } } );  
EX: db.users.updateOne( { username: "dyang" }, { $set: { role: "admin" } } );

**Accessing the Website** 
- After ensuring that all 3 frameworks are running, the website can be accessed through
http://localhost:3000.

**Troublshooting**
- If it says Next.JS is out of date use this command to update the packages
- npm i next@latest (https://nextjs.org/docs/messages/version-staleness)
