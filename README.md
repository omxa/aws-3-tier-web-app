# AWS Three Tier Web Application

## Description:
This project demonstrates how to design and deploy a **3-tier architecture** on AWS, following industry best practices.  

The stack consists of:
- **Frontend (Web Tier)**: React app served via Nginx on EC2
- **Backend (App Tier)**: Node.js application on private EC2
- **Database (DB Tier)**: Amazon Aurora (MySQL-compatible)
- **Networking**: VPC with public and private subnets, Internet Gateway, NAT Gateway
- **Load Balancers**: Internet-facing ALB (for web), Internal ALB (for app)
- **IAM & SSM**: Secure access without SSH keys

## AWS Services Used
- **VPC** with 6 subnets (2 public, 2 private-app, 2 private-db)
- **Security Groups** (LB SG, Web SG, Internal LB SG, App SG, DB SG)
- **EC2 Instances** (Amazon Linux 2023 / 2)
- **Elastic Load Balancers (ALB)** (internet-facing + internal)
- **Amazon Aurora (MySQL-compatible)** with DB subnet group
- **IAM Role with AmazonSSMManagedInstanceCore** for EC2
- **AWS Systems Manager (SSM)** for secure instance access
- **S3** (optional, for code hosting)
- **CloudWatch** for monitoring


## Architecture Overview

In this architecture, a public-facing Application Load Balancer forwards client traffic to our web tier EC2 instances. The web tier is running Nginx webservers that are configured to serve a React.js website and redirects our API calls to the application tier’s internal facing load balancer. The internal facing load balancer then forwards that traffic to the application tier, which is written in Node.js. The application tier manipulates data in an Aurora MySQL multi-AZ database and returns it to our web tier. Load balancing, health checks and autoscaling groups are created at each layer to maintain the availability of this architecture.


## Step-by-Step Setup

### 1. VPC & Subnets
1. Create a VPC:  
   - CIDR: `10.0.0.0/16`  
   - Name: **`3-tier-vpc`**
2. Create 6 subnets (spread across 2 AZs):  
   - **Public Subnets**: **`3-tier-public-subnet-az-1`**, **`3-tier-public-subnet-az-2`**  
   - **Private App Subnets**: **`3-tier-private-app-subnet-az-1`**, **`3-tier-private-app-subnet-az-2`**  
   - **Private DB Subnets**: **`3-tier-private-db-subnet-az-1`**, **`3-tier-private-db-subnet-az-2`**  
3. Attach Internet Gateway: `3-tier-igw` to VPC.  
4. Create NAT Gateways `3-tier-ngw-az-1` and `3-tier-ngw-az-2` in public subnets.  
5. Update Route Tables:
   - Public `0.0.0.0/0` → IGW `3-tier-igw`
   - Private subnet 1 `3-tier-private-app-subnet-az-1` → NAT Gateway for AZ-1
   - Private subnet 2 `3-tier-private-app-subnet-az-2` → NAT Gateway for AZ-2

---

### 2. Security Groups
Create the following Security Groups:

- **Internet-facing LB SG** (**`3-tier-internet-facing-lb-sg`**)  
  - Inbound: HTTP (80) from `0.0.0.0/0`  
- **Web Tier SG** (**`3-tier-web-tier-sg`**)  
  - Inbound: HTTP (80) from **`3-tier-internet-facing-lb-sg`** and `0.0.0.0/0` 
- **Internal LB SG** (**`3-tier-internal-lb-sg`**)  
  - Inbound: HTTP (80) from **`3-tier-web-tier-sg`**
- **App Tier SG** (**`3-tier-app-tier-sg`**)  
  - Inbound: App Port (4000) from **`3-tier-internal-lb-sg`** and `0.0.0.0/0`
- **DB SG** (**`3-tier-db-sg`**)  
  - Inbound: MySQL/Aurora (3306) from **`3-tier-app-tier-sg`**

---

### 3. Database Setup (Aurora MySQL)
1. Create **DB subnet group** **`3-tier-db-subnet-group`** with the 2 DB subnets **`3-tier-private-db-subnet-az-1`** and **`3-tier-private-db-subnet-az-2`**  
2. Create **Aurora MySQL cluster**:
   - Name: **`database-1`**
   - Engine: MySQL-compatible Aurora  
   - Instance type: `db.t3.micro` (free-tier)
   - Subnet group: **`3-tier-db-subnet-group`**  
   - Security group: **`3-tier-db-sg`**  
4. Note the **Writer instance endpoint** for later. (Should be something like `database-1.cluster-ce96sgugv1.us-east-1.rds.amazonaws.com`)

---

### 4. EC2 Setup

#### Web Tier (Public EC2)
1. Launch EC2 in **public subnet** with **`3-tier-web-tier-sg`**.  
2. Attach IAM Role: `AmazonSSMManagedInstanceCore`.  
3. Install Nginx:  
   ```bash
   sudo dnf install nginx -y
   sudo systemctl enable nginx
   sudo systemctl start nginx
4. Deploy React build files under /usr/share/nginx/html.

#### App Tier (Private EC2)
1. Launch EC2 in private app subnet with App SG (**`3-tier-app-tier-sg`**).
2. Attach IAM Role: `AmazonSSMManagedInstanceCore`.
3. Install Node.js + MySQL client.
4. Clone app repository / download source from S3.
5. Configure .env with:
   ```bash
   DB_HOST=<YOUR_RDS_ENDPOINT>
   DB_USER=<YOUR_DB_USER>
   DB_PASS=<YOUR_DB_PASS>
   DB_NAME=<YOUR_DB_NAME>
   PORT=4000
   
-- 

### 5. Load Balancers
Internet-facing ALB (Application Load Balancer):
  Subnets: Public subnets **`3-tier-public-subnet-az-1`** and **`3-tier-public-subnet-az-2`**  
  Target Group: Web EC2s (port 80)
Internal ALB (Application Load Balancer):
  Subnets: Private App subnets **`3-tier-private-app-subnet-az-1`** and **`3-tier-private-app-subnet-az-2`**  
  Target Group: App EC2s (port 4000)

--

### 6. Application Flow
User opens ALB DNS → routes to Web EC2 (Nginx).
Web app proxies/API calls to internal ALB.
Internal ALB forwards requests to App EC2.
App EC2 queries Aurora DB and returns data.

### Validation
Visit Public ALB DNS → website loads.
Add sample data in UI → verify entries saved in DB via MySQL client.
Delete entries in UI → confirm deletion in DB.

### Cleanup (To avoid any charges)
Delete EC2 instances, Auto Scaling Groups.
Delete Load Balancers + Target Groups.
Delete RDS Cluster.
Delete NAT Gateway.
Delete VPC.

## License
This library is licensed under the MIT-0 License. See the LICENSE file.
