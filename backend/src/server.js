import app from './app.js';
import { connectMongoDB } from './mongoDb.js';

const PORT = process.env.PORT || 4000;

// Try MongoDB first, then start listening
connectMongoDB().then((connected) => {
  if (connected) {
    console.log('🍃 Running with MongoDB Atlas as primary database.');
  } else {
    console.log('📁 Running with embedded SQLite database.');
  }

  app.listen(PORT, () => {
    console.log(`✅ RentRight backend listening on http://localhost:${PORT}`);
  });
});

