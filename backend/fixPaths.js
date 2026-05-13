import sequelize from './database.js';
import { Anexo } from './models/index.js';

async function fixPaths() {
  try {
    console.log('[INFO] Starting path conversion migration...');
    
    const anexos = await Anexo.findAll();
    console.log(`[INFO] Found ${anexos.length} anexos to process`);

    for (const anexo of anexos) {
      const currentPath = anexo.caminhoArquivo;
      
      // Skip if already in correct format
      if (!currentPath.includes('\') && currentPath.startsWith('backend/')) {
        console.log(`[SKIP] ${anexo.id} - Already in correct format`);
        continue;
      }

      // Convert absolute path to relative URL
      let newPath = currentPath
        .replace(/\/g, '/')
        .split('backend/')[1];
      
      if (!newPath) {
        // If split didn't work, try other approach
        if (currentPath.includes('uploads/')) {
          newPath = currentPath.substring(currentPath.indexOf('uploads/'));
        } else {
          console.log(`[ERROR] ${anexo.id} - Could not parse path: ${currentPath}`);
          continue;
        }
      }

      const finalPath = `backend/${newPath}`;
      
      await anexo.update({ caminhoArquivo: finalPath });
      console.log(`[OK] ${anexo.id} - Updated`);
    }

    console.log('[INFO] Migration complete!');
    process.exit(0);
  } catch (erro) {
    console.error('[ERROR]', erro);
    process.exit(1);
  }
}

fixPaths();
