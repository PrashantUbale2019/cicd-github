import express from 'express';

const app = express();

app.get('/ready', (req, res) => res.status(200).send('<h2>Task 1 is ready!</h2>'));
app.get('/health', (req, res) => res.status(200).send('<h2>Task 1 is healthy!</h2>'));

  
const PORT = process.env.PORT || 3000; // 👈 Ensure this defaults to 3000


app.listen(PORT, '0.0.0.0', () => { // 👈 '0.0.0.0' allows external cluster access
  console.log(`Server running on port ${PORT}`);
});

