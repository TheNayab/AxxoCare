const app = require ( "./App.js")
const connectToDb = require ( "./configure/db.js")
const  dotenv =require ("dotenv")


dotenv.config({path:"../backend/configure/config.env"})

connectToDb();

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running at http://localhost:${process.env.PORT}`);
  });   