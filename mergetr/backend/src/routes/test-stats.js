// Test simple des routes stats
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Test d'import du fichier stats
console.log('Testing stats.js import...');

try {
    const statsModule = await import('./stats.js');
    console.log('✅ stats.js imported successfully');
    console.log('Export type:', typeof statsModule.default);
} catch (error) {
    console.error('❌ Error importing stats.js:', error);
}
