# 🔧 Troubleshooting Guide - Admin Panel

## Module Resolution Errors

### Error: "Cannot find module './611.js'"

यो error Next.js को webpack bundling process मा आउँछ। यहाँ solutions छन्:

#### ✅ **Solution 1: Clean Build Cache**
```bash
# Remove build cache
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
npm run build
```

#### ✅ **Solution 2: Update Next.js Configuration**
`next.config.ts` मा यो configuration add गर्नुहोस्:
```typescript
const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};
```

#### ✅ **Solution 3: Package Scripts**
`package.json` मा यो scripts add गर्नुहोस्:
```json
{
  "scripts": {
    "clean": "rm -rf .next && rm -rf node_modules/.cache",
    "clean-build": "npm run clean && npm run build",
    "rebuild": "npm run clean && npm install && npm run build"
  }
}
```

#### ✅ **Solution 4: Node Modules Reinstall**
```bash
# Complete clean install
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

## Common Issues & Solutions

### 1. **Build Errors**
```bash
# Error: Cannot apply unknown utility class `group`
# Solution: Update Tailwind CSS configuration
```

### 2. **Import Errors**
```bash
# Error: Cannot resolve module
# Solution: Check file paths and extensions
```

### 3. **TypeScript Errors**
```bash
# Error: Type not found
# Solution: Install missing type definitions
npm install @types/[package-name] --save-dev
```

### 4. **CSS/Styling Issues**
```bash
# Error: Tailwind classes not working
# Solution: Check tailwind.config.js and imports
```

## Development Server Issues

### 1. **Port Already in Use**
```bash
# Error: Port 3000 is already in use
# Solution: Use different port
npm run dev -- -p 3001
```

### 2. **Hot Reload Not Working**
```bash
# Solution: Clear cache and restart
npm run clean
npm run dev
```

### 3. **Environment Variables**
```bash
# Error: Environment variable not found
# Solution: Check .env.local file
```

## Production Deployment Issues

### 1. **Build Fails in Production**
```bash
# Solution: Check for client-side only code
# Use dynamic imports for client components
```

### 2. **Static Generation Errors**
```bash
# Error: getStaticProps/getServerSideProps
# Solution: Check API routes and data fetching
```

### 3. **Image Optimization Issues**
```bash
# Error: Image optimization failed
# Solution: Check next.config.js image configuration
```

## Performance Issues

### 1. **Slow Build Times**
```bash
# Solution: Optimize dependencies
npm run build -- --debug
```

### 2. **Large Bundle Size**
```bash
# Solution: Use dynamic imports
# Check bundle analyzer
npm install @next/bundle-analyzer
```

### 3. **Memory Issues**
```bash
# Solution: Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Debugging Tools

### 1. **Next.js Debug Mode**
```bash
# Enable debug logging
DEBUG=* npm run dev
```

### 2. **Webpack Bundle Analyzer**
```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer
```

### 3. **TypeScript Check**
```bash
# Check TypeScript errors
npx tsc --noEmit
```

### 4. **ESLint Check**
```bash
# Check code quality
npm run lint
```

## Browser Issues

### 1. **Hydration Mismatch**
```bash
# Solution: Use useEffect for client-side only code
# Check for server/client rendering differences
```

### 2. **JavaScript Errors**
```bash
# Solution: Check browser console
# Use React Developer Tools
```

### 3. **CSS Not Loading**
```bash
# Solution: Check CSS imports
# Verify Tailwind configuration
```

## Database/API Issues

### 1. **API Routes Not Working**
```bash
# Solution: Check API route structure
# Verify middleware configuration
```

### 2. **Database Connection Issues**
```bash
# Solution: Check database configuration
# Verify environment variables
```

### 3. **CORS Errors**
```bash
# Solution: Configure CORS headers
# Check API endpoint URLs
```

## Quick Fixes Checklist

### Before Reporting Issues:
- [ ] Clear build cache (`.next` folder)
- [ ] Restart development server
- [ ] Check browser console for errors
- [ ] Verify all dependencies are installed
- [ ] Check environment variables
- [ ] Try different browser/device
- [ ] Check network connectivity

### Common Commands:
```bash
# Clean everything
npm run clean

# Fresh install
rm -rf node_modules package-lock.json
npm install

# Build and test
npm run build
npm run start

# Development
npm run dev
```

## Getting Help

### 1. **Check Documentation**
- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev
- Tailwind docs: https://tailwindcss.com/docs

### 2. **Community Support**
- GitHub Issues
- Stack Overflow
- Discord communities

### 3. **Debug Information**
जब help माग्नुहोस्, यो information provide गर्नुहोस्:
- Node.js version
- Next.js version
- Operating system
- Browser version
- Error messages (full stack trace)
- Steps to reproduce

---

## 🎯 **Quick Fix for Current Issue**

यदि तपाईंले "Cannot find module './611.js'" error देख्नुभएको छ:

```bash
# Step 1: Clean build cache
npm run clean

# Step 2: Rebuild
npm run build

# Step 3: Start development server
npm run dev
```

यदि अझै पनि error आउँछ:
```bash
# Complete reset
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

**तपाईंको admin panel अब perfectly काम गर्नेछ!** 🚀
