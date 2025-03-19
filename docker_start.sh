#!/bin/bash

# Start frameworks
source /app/FastAPI/venv/bin/activate
cd FastAPI
uvicorn app:app &
cd ../
mkdir -p /app/MongoDB/data/db
mongod --bind_ip 0.0.0.0 --dbpath /app/MongoDB/data/db --logpath /app/MongoDB/data/mongod.log --fork
npm run dev &
sleep 5

# Add default users
curl -X POST -d '{"username":"user", "password":"password"}' http://127.0.0.1:3000/api/auth/signup
curl -X POST -d '{"username":"admin", "password":"password"}' http://127.0.0.1:3000/api/auth/signup

# Give default admin user admin role
mongosh 127.0.0.1:27017 <<EOF
    use trafficai;
    db.users.updateOne(
        { username: "admin" },
        { \$set: { role: "admin" } }
    );
EOF

# Prevent container exit
wait