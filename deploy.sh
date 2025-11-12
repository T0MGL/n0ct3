#!/bin/bash

# NOCTE Production Deployment Script
# Domain: nocte.studio

echo "🚀 NOCTE Production Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓${NC} npm version: $NPM_VERSION"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Dependencies installed"

# Run linting
echo ""
echo "🔍 Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Linting warnings found (continuing...)${NC}"
fi

# Run production build
echo ""
echo "🏗️  Building for production..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Build successful"

# Check bundle sizes
echo ""
echo "📊 Bundle sizes:"
ls -lh dist/assets/*.js | awk '{print "   " $9 " - " $5}'
echo ""

# Environment check
echo "🔐 Environment Variables Check:"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production exists"
    
    # Check for placeholder values
    if grep -q "YOUR_KEY" .env.production; then
        echo -e "${YELLOW}⚠ Warning: .env.production contains placeholder values${NC}"
        echo -e "   Update these before deploying:"
        grep "YOUR_KEY" .env.production | sed 's/^/   /'
    fi
else
    echo -e "${YELLOW}⚠ .env.production not found${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Pre-deployment checks complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.production with production Stripe key"
echo "2. Set environment variables in Vercel Dashboard"
echo "3. Deploy:"
echo ""
echo "   ${YELLOW}git add .${NC}"
echo "   ${YELLOW}git commit -m \"Production ready for nocte.studio\"${NC}"
echo "   ${YELLOW}git push origin main${NC}"
echo ""
echo "   OR"
echo ""
echo "   ${YELLOW}vercel --prod${NC}"
echo ""
echo "🎉 Ready to deploy to nocte.studio!"
