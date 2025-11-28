In this DevOps task, you need to build and deploy a full-stack CRUD application using the MEAN stack (MongoDB, Express, Angular 15, and Node.js). The backend will be developed with Node.js and Express to provide REST APIs, connecting to a MongoDB database. The frontend will be an Angular application utilizing HTTPClient for communication.  

The application will manage a collection of tutorials, where each tutorial includes an ID, title, description, and published status. Users will be able to create, retrieve, update, and delete tutorials. Additionally, a search box will allow users to find tutorials by title.

## Project setup

### Node.js Server

cd backend

npm install

You can update the MongoDB credentials by modifying the `db.config.js` file located in `app/config/`.

Run `node server.js`

### Angular Client

cd frontend

npm install

Run `ng serve --port 8081`

You can modify the `src/app/services/tutorial.service.ts` file to adjust how the frontend interacts with the backend.

Navigate to `http://localhost:8081/`

### 1. Create a Virtual Machine in AWS Cloud Platform
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 07 26 AM" src="https://github.com/user-attachments/assets/5e49236c-5ca2-4a42-970e-30083d41db5d" />

### 2. Install the required dependencies like Docker
```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install docker
sudo apt install -y ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# optionally add your user to docker group
sudo usermod -aG docker $USER && newgrp docker
# log out and log back in or use `newgrp docker`

```
### 3. Create a Repository in GitHub and clone the repository into your AWS VM
```bash
git init
git remote add origin https://github.com/Devivaraprasadreddy/DiscoverDollarTask.git
git add .
git commit -m "message"
git branch
git push origin main/master
```
### 4. Create Dockerfile for Frontend
```bash
# Build Angular app
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration production

# Nginx for serving Angular
FROM nginx:alpine
COPY --from=build /app/dist/angular-15-crud /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
### 5. Create a config file for nginx reverse proxy
```bash
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # Angular SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```
### 6. Create a Dockerfile for Backend
```bash
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```
### 7. Create a docker-compose.yml in root directory
```bash
version: "3.8"

services:
  mongo:
    image: mongo:6.0
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: appdb
    networks:
      - app-network

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      - PORT=3000
      - MONGO_URL=mongodb://mongo:27017/appdb
    depends_on:
      - mongo
    networks:
      - app-network

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```
### 8. Create one directory for environments inside frontend
```bash
mkdir /frontend/src/environemnts
```
### 9. Inside that environment directory create files
```bash
vi environment.prod.ts
```
### Paste this content
```bash
export const environment = {
  production: true,
  apiUrl: '/api'
};
```
```bash
vi environment.ts
```
### Paste this content
```bash
export const environment = {
  production: false,
  apiUrl: '/api'
};
```
### 10. Create server.js inside the backend directory
```bash
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
db.mongoose.connect(process.env.MONGO_URL || db.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to the database!");
}).catch(err => {
  console.log("Cannot connect to the database!", err);
  process.exit();
});

require("./app/routes/tutorial.routes")(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}.`);
});
```
### 11. Create the GitHub Actions workflow
```bash
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build & push backend image
        run: |
          docker build -t dsp9391/discoverdollar-backend:latest ./backend
          docker push dsp9391/discoverdollar-backend:latest

      - name: Build & push frontend image
        run: |
          docker build -t dsp9391/discoverdollar-frontend:latest ./frontend
          docker push dsp9391/discoverdollar-frontend:latest

      - name: SSH & deploy to VM
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd /home/ubuntu/DiscoverDollarTask
            docker compose pull
            docker compose up -d
```
### 12. Create the Secrets and Variables inside the repository settings
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 35 14 AM" src="https://github.com/user-attachments/assets/c5ac7b94-5647-4b3f-9bd1-e2838b30a4c7" />

### 13. Run the below commands to containerize the application
```bash
docker compose build --no-cache
docker compose up -d
```
### 14. To stop the container
```bash
docker compose down
```
### 15. Check the running containers
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 41 14 AM" src="https://github.com/user-attachments/assets/42a457ed-6fe8-4480-be10-da1b87c2a1b4" />

### Access the application
```bash
http://<your-instance-public-ip>80
```
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 56 AM" src="https://github.com/user-attachments/assets/a9cded17-5b23-42da-a116-85fcff89b45b" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 03 41 AM" src="https://github.com/user-attachments/assets/e6abd60e-e1d8-427b-9d33-c0fb861d4441" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 03 54 AM" src="https://github.com/user-attachments/assets/33b7a977-f8a5-40af-8926-b71aabef29d0" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 04 36 AM" src="https://github.com/user-attachments/assets/edcb0f28-b3d7-4d78-a3b1-2e8512de773d" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 04 45 AM" src="https://github.com/user-attachments/assets/3c38def1-0330-4352-86a8-913cd531ee17" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 03 AM" src="https://github.com/user-attachments/assets/69f8d686-5bcf-4240-948a-a34d271a8cae" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 13 AM" src="https://github.com/user-attachments/assets/4ed51a66-12f7-4dce-8608-c92a1c4c953c" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 22 AM" src="https://github.com/user-attachments/assets/85d3acf2-2861-4b9f-ab35-1da4b21267ba" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 31 AM" src="https://github.com/user-attachments/assets/ca5dbf63-95a0-4b37-b77a-58215abf58ce" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 40 AM" src="https://github.com/user-attachments/assets/845ae8c3-7fda-4cf6-a9d7-283100ecc40e" />
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 05 48 AM" src="https://github.com/user-attachments/assets/2f2a359f-da96-4139-9dfe-76e547bcf1d6" />


### check the Dockerhub Repository whether images is pushing or not
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 47 50 AM" src="https://github.com/user-attachments/assets/56c0544b-ce2d-4289-b862-68e85c4d01d8" />

### Run the workflow in GitHub
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 48 35 AM" src="https://github.com/user-attachments/assets/58d8ae4e-1396-4d8d-9867-d89dfcc044a0" />

### Latest Images pushed to Dockerhub Account
<img width="1440" height="900" alt="Screenshot 2025-11-28 at 9 51 32 AM" src="https://github.com/user-attachments/assets/6efa540e-2be0-41bf-a589-f05448087c0d" />

### Descritpion
### Repository Setup
Create a new GitHub repository for this project.
Push the complete code to the repository.

### Containerization & Deployment
Create Docker files for both the frontend and backend.
Build and push Docker images to your Docker Hub account.
Set up a new Ubuntu virtual machine on any cloud platform (AWS, Azure, or similar).
Use Docker Compose to deploy the application on this VM.

### Database Setup
Choose one of the following options:
Install MongoDB directly on the Ubuntu VM.
OR use the official MongoDB Docker image as part of your Docker Compose setup.
CI/CD Pipeline Configuration
Use GitHub Actions or Jenkins to implement a CI/CD pipeline.

### The pipeline should:
Build updated Docker images when changes are pushed to GitHub.
Push those images to Docker Hub.
Automatically pull the latest images and restart containers on the VM.

### Nginx Reverse Proxy
Set up Nginx as a reverse proxy.
The entire application should be accessible via port 80 


