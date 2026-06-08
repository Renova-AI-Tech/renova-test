import { defaultDatabasePath, openDatabase } from "./db";
import { seedDatabase } from "./seed-data";

const db = openDatabase();

seedDatabase(db);
db.close();

console.log(`Seed concluido em ${defaultDatabasePath}`);
