# Election Voting Analytics & Simulation Platform

This repository contains the source code and infrastructure scripts for a production-grade Election Voting Analytics & Simulation Platform, designed specifically for Andhra Pradesh for demonstration and technical evaluation purposes.

## Warning
**This platform is strictly a simulation. It does not reflect any real-world election data, systems, or voting patterns.**

## System Flow & Architecture
The system uses a modern, scalable architecture:
1. **Frontend:** Built with Next.js and TailwindCSS. Uses Recharts for real-time data visualization and Socket.IO for live updates.
2. **Backend:** Node.js Express server utilizing Prisma ORM to interact with PostgreSQL. Exposes REST APIs for geographical hierarchies and vote submission. Emits WebSocket events on new votes.
3. **Database:** PostgreSQL stores hierarchical geographical data (State -> District -> Mandal -> Village), political parties, and idempotency-checked voting records.
4. **Infrastructure:** Docker containerized services, orchestrated locally via Docker Compose. Production deployment defined via Kubernetes (EKS) manifests and Terraform.

## Deliverables Included
* `/frontend`: Next.js dashboard source code.
* `/backend`: Node.js API and WebSocket server, including Prisma schema.
* `/backend/simulate.ts`: Script to seed mock data and simulate high-throughput voting.
* `/terraform`: AWS EKS and RDS provisioning via Terraform.
* `/k8s`: Kubernetes manifests for deploying the applications.
* `/docker-compose.yml`: Local multi-container setup.

## Setup Instructions (Local)

### Prerequisites
- Node.js v20+
- Docker and Docker Compose (Ensure Docker Desktop is running)

### 1. Build and Run the Stack
To ensure both the frontend and backend are built with the latest configurations and dependencies, run the following command from the root directory (`devops-voting-app`):
```bash
docker-compose up -d --build
```
*(If you make changes to the code later, you can rebuild specific containers using `docker-compose up -d --build frontend` or `docker-compose up -d --build backend`)*

Once running, access the **Frontend Dashboard** at `http://localhost:3000`.

### 2. Simulating Votes (Windows Troubleshooting Guide)
To populate the dashboard with mock data, you need to use the `simulate.ts` script. 

**Important for Windows PowerShell users:** If you encounter Execution Policy errors when running `npm` commands, switch to the classic Command Prompt first:
1. Open your terminal and type `cmd`, then press Enter.
2. Navigate into the backend folder:
   ```cmd
   cd backend
   ```

**Install Dependencies:**
The simulation script requires a few packages to run locally outside of Docker. Run these commands inside the `backend` folder:
```cmd
npm install ts-node typescript @types/node axios
```
*(Note: `axios` is required to send HTTP requests to the backend API)*

**Generate Prisma Client:**
So the simulation script knows how to talk to your local database, generate the client:
```cmd
npx prisma generate
```

**Seed the Database:**
Run this once to populate the database with Andhra Pradesh districts, mandals, villages, and political parties:
```cmd
npx ts-node simulate.ts seed
```

**Run the Simulation:**
To send 100 random votes to the system instantly and see the dashboard update in real-time:
```cmd
npx ts-node simulate.ts simulate 100
```
*(You can change 100 to any number to send more votes. The backend rate limit is configured to accept up to 1000 votes per minute).*

## Deployment to AWS (Production)
1. Initialize Terraform:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```
2. Build and push Docker images:
   ```bash
   docker build -t your-registry/voting-backend ./backend
   docker build -t your-registry/voting-frontend ./frontend
   docker push your-registry/voting-backend
   docker push your-registry/voting-frontend
   ```
3. Apply Kubernetes Manifests:
   ```bash
   aws eks update-kubeconfig --name voting-cluster --region ap-south-1
   kubectl apply -f k8s/deployment.yaml
   ```
