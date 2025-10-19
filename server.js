import app from './index.js';

const port = process.env.PORT || 8080;
// Bind to 0.0.0.0 so Cloud Run can reach it
app.listen(port, '0.0.0.0', () => {
  console.log(`clickup-mapper running on ${port}`);
});
