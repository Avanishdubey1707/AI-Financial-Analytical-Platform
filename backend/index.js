require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

connectDB();

// app.listen(process.env.PORT || 3000, () => {
//   console.log(`Server is running on port ${process.env.PORT || 3000}`);
// });

app.listen(8080, "0.0.0.0", () => {
    console.log("Server is running on port 8080");
});