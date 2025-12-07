const mysql = require('mysql2/promise');

async function checkIndexes() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'tinylearn_db'
        });

        console.log('\n=== Checking submissions table indexes ===\n');
        const [indexes] = await conn.query('SHOW INDEX FROM submissions');
        indexes.forEach(idx => {
            console.log(`Index: ${idx.Key_name}`);
            console.log(`  Column: ${idx.Column_name}`);
            console.log(`  Unique: ${idx.Non_unique === 0 ? 'Yes' : 'No'}`);
            console.log(`  Type: ${idx.Index_type}`);
            console.log('---');
        });

        console.log('\n=== Testing UPDATE performance ===\n');
        
        // Test update speed
        const start = Date.now();
        await conn.query(
            'UPDATE submissions SET score = 80 WHERE id = 2'
        );
        const elapsed = Date.now() - start;
        console.log(`UPDATE query took: ${elapsed}ms`);
        
        if (elapsed > 1000) {
            console.log('⚠️  UPDATE is SLOW! This is the problem.');
        } else {
            console.log('✅ UPDATE is fast.');
        }

        await conn.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkIndexes();
