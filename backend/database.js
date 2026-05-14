import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sequelize;

if (process.env.DATABASE_URL) {
  // PostgreSQL no Railway (produção)
  console.log('[INFO] Usando PostgreSQL (DATABASE_URL detectada)');

  // SSL é necessário para Postgres externo (ex: Supabase), mas NÃO para
  // a rede interna do Railway (postgres.railway.internal) que usa TLS automático.
  // Habilitar SSL apenas se a env DATABASE_SSL=true estiver setada.
  const useSSL = process.env.DATABASE_SSL === 'true';

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: useSSL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {},
    logging: false,
  });
} else {
  // SQLite local (desenvolvimento)
  console.log('[INFO] Usando SQLite (desenvolvimento local)');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../vet_assist.db'),
    logging: false,
  });
}

export default sequelize;
