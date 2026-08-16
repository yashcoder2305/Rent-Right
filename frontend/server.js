const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('You can access your HTML pages directly via:');
    console.log(`- http://localhost:${PORT}/landing.html`);
    console.log(`- http://localhost:${PORT}/dashboard.html`);
    console.log(`- http://localhost:${PORT}/analyze.html`);
    console.log(`- http://localhost:${PORT}/results.html`);
});
