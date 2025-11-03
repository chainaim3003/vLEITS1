# vLEI TypeScript Implementation - Production Ready

## 🎯 Overview

This is a **production-grade vLEI (Verifiable Legal Entity Identifier) implementation** that follows official GLEIF specifications and implements proper KERI/ACDC protocols with complete IPEX flows.

### What Makes This Implementation Correct

✅ **Credential Registries** - Proper TEL anchoring for lifecycle management  
✅ **OOBI Resolution** - Cryptographic entity discovery before credential exchange  
✅ **IPEX Protocol** - Complete grant/admit flow for credential delivery  
✅ **Notification Handling** - Asynchronous credential exchange processing  
✅ **Credential State Queries** - Real-time status verification  
✅ **100% TypeScript** - Type-safe implementation, JS only in build/  
✅ **Based on Official GLEIF Trainings** - Patterns from vlei-trainings repository  

## 📋 Prerequisites

- **Docker & Docker Compose** - For running KERIA and witnesses
- **Node.js 18+** and npm
- **8GB RAM** - For KERIA agent service
- **Git Bash** (on Windows) - For running shell scripts

## 🚀 Quick Start

### 1. Deploy Infrastructure

```bash
# Make scripts executable (Linux/Mac)
chmod +x deploy.sh stop.sh

# Start services
./deploy.sh
```

Wait about 60 seconds for all services to be healthy.

### 2. Install CLI Dependencies

```bash
cd cli
npm install
```

### 3. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

### 4. Run Setup

```bash
npm run setup:jupiter
```

This creates the complete Jupiter Knitting Mills vLEI trust chain with proper IPEX flows.

## 📂 Project Structure

```
vLEITS1/
├── docker-compose.yml          # Infrastructure definition
├── deploy.sh                   # Start script
├── stop.sh                     # Stop script
├── .env                        # Configuration
│
└── cli/
    ├── package.json            # Dependencies
    ├── tsconfig.json           # TypeScript config
    ├── src/                    # TypeScript source (you edit these)
    │   ├── index.ts            # CLI entry point
    │   ├── commands/
    │   │   └── setup-jupiter.command.ts  # Main setup with IPEX
    │   ├── services/
    │   │   ├── keria.service.ts         # Enhanced KERIA service
    │   │   └── storage.service.ts       # Data persistence
    │   ├── types/
    │   │   └── vlei.types.ts            # Type definitions
    │   └── utils/
    │       └── console.utils.ts         # Pretty console output
    │
    ├── build/                  # Compiled JavaScript (generated)
    └── data/                   # JSON storage (generated)
        ├── identities.json
        ├── credentials.json
        ├── registries.json
        └── connections.json
```

## 🔧 Available Commands

```bash
# Setup complete vLEI chain
npm run setup:jupiter

# List all identities
node build/index.js list-identities

# List all credentials
node build/index.js list-credentials

# List credential registries
node build/index.js list-registries

# List OOBI connections
node build/index.js list-connections

# Clear all data
node build/index.js clear

# Rebuild TypeScript
npm run build

# Clean build and data
npm run clean
```

## 🏗️ Trust Chain Created

```
GLEIF ROOT (Global Foundation)
    ↓
QVI (Qualified vLEI Issuer)
    LEI: 254900OPPU84GM83MG36
    ↓
Legal Entity: Jupiter Knitting Mills Inc
    LEI: 9845002862F66EBD0E2B
    ↓
Official Organizational Role: Seller Representative
    Person: Sarah Johnson
    ↓
Engagement Context Role: Seller Agent
    Type: AI Agent ✓ Legally Attached
```

## 🔐 Security Features

✅ OOBI Resolution - Cryptographic entity discovery  
✅ KEL Synchronization - Key event log consistency  
✅ TEL Tracking - Credential lifecycle management  
✅ IPEX Protocol - Proof of credential delivery  
✅ Credential Registries - Proper status tracking  

---

**Version**: 2.0.0  
**Status**: ✅ Complete and Functional  
**Based On**: Official GLEIF vlei-trainings  

**Built with 💚 using TypeScript, KERI, and vLEI**
