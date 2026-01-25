# Frontend Port Configuration

## Port Settings

The frontend application is configured to run on **port 6001**.

### Configuration Files Updated:

1. **`package.json`**:
   - `dev` script: `next dev -p 6001`
   - `start` script: `next start -p 6001`

### How to Run:

#### Development Mode:
```bash
npm run dev
```
The application will start on: **http://localhost:6001**

#### Production Mode:
```bash
npm run build
npm start
```
The application will start on: **http://localhost:6001**

### Notes:

- The port is specified using the `-p` flag in the npm scripts
- All API endpoints configured in `lib/api-config.ts` remain unchanged
- This only affects the frontend Next.js server port
- Backend API URLs are configured separately in `lib/api-config.ts`

### Environment Variables:

If you need to override the port via environment variable, you can use:

```bash
PORT=6001 npm run dev
```

Or create a `.env.local` file:
```env
PORT=6001
```

---

**Last Updated**: December 2024




