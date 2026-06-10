const app = require('./api/index');
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`==================================================`);
  console.log(`  ShramiKare Node.js Backend is running locally!`);
  console.log(`  Url: http://localhost:${port}`);
  console.log(`==================================================`);
});
