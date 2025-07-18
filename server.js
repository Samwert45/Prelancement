const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration PostgreSQL pour Render avec retry
const dbConfig = {
    user: 'gitivity_user',
    password: process.env.DB_PASSWORD,
    host: 'dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com',
    port: 5432,
    database: 'gitivity',
    ssl: { rejectUnauthorized: false },
    max: 5, // Réduire le nombre de connexions
    idleTimeoutMillis: 10000, // 10 secondes
    connectionTimeoutMillis: 3000, // 3 secondes
    acquireTimeoutMillis: 3000,
    statement_timeout: 5000, // timeout des requêtes
    query_timeout: 5000,
};

console.log('🔧 Configuration DB:', {
    user: dbConfig.user,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    password_set: !!process.env.DB_PASSWORD
});

const pool = new Pool(dbConfig);

// Gestion des erreurs du pool
pool.on('error', (err) => {
    console.error('💥 Erreur pool PostgreSQL:', err);
});

pool.on('connect', () => {
    console.log('✅ Nouvelle connexion PostgreSQL');
});

pool.on('remove', () => {
    console.log('🔌 Connexion PostgreSQL fermée');
});

// Route webhook avec retry et gestion d'erreurs
app.post('/webhook.php', async (req, res) => {
    console.log('🚀 === DÉBUT WEBHOOK ===');
    console.log('📧 Body reçu:', JSON.stringify(req.body, null, 2));
    
    let client;
    let retries = 3;
    
    while (retries > 0) {
        try {
            const { email, date, source } = req.body;
            console.log('📝 Variables extraites:', { email, date, source });
            
            if (!email) {
                console.log('❌ Email manquant');
                return res.status(400).json({ error: 'Email requis' });
            }
            
            console.log(`🔄 Tentative ${4-retries}/3 - Connexion à la DB...`);
            
            // Utiliser une nouvelle connexion à chaque fois
            client = await pool.connect();
            console.log('✅ Client connecté');
            
            // Test rapide
            await client.query('SELECT 1');
            console.log('✅ Test connexion OK');
            
            console.log('💾 Exécution INSERT...');
            const result = await client.query(
                'INSERT INTO users (email, created_at, source) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
                [email, date || new Date().toISOString(), source || 'gitanalyse']
            );
            
            console.log('📊 Résultat:', result.rows);
            
            // Libérer la connexion immédiatement
            client.release();
            client = null;
            
            if (result.rows.length > 0) {
                console.log('✅ Nouvel email sauvegardé:', email);
                return res.json({ success: true, message: 'Email sauvegardé', id: result.rows[0].id });
            } else {
                console.log('⚠️ Email déjà existant:', email);
                return res.json({ success: true, message: 'Email déjà enregistré', already_exists: true });
            }
            
        } catch (error) {
            console.error(`💥 Erreur tentative ${4-retries}:`, error.message);
            
            // Libérer la connexion en cas d'erreur
            if (client) {
                try {
                    client.release();
                    client = null;
                } catch (releaseError) {
                    console.error('❌ Erreur release:', releaseError.message);
                }
            }
            
            retries--;
            
            if (retries > 0) {
                console.log(`🔄 Retry dans 1 seconde... (${retries} tentatives restantes)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.error('💥 === TOUTES LES TENTATIVES ÉCHOUÉES ===');
                console.error('❌ Error final:', error.message);
                console.error('❌ Error code:', error.code);
                console.error('❌ Error stack:', error.stack);
                
                return res.status(500).json({ 
                    error: 'Erreur base de données après plusieurs tentatives', 
                    details: error.message 
                });
            }
        }
    }
});

// Health check pour Render
app.get('/', (req, res) => {
    res.json({ status: 'OK', service: 'Gitanalyse webhook' });
});

// Test database
app.get('/test-db', async (req, res) => {
    try {
        console.log('🧪 Test database...');
        
        // Test connexion
        const timeResult = await pool.query('SELECT NOW() as current_time');
        console.log('⏰ Time from DB:', timeResult.rows[0]);
        
        // Test table users
        const tableTest = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('📋 Colonnes table users:', tableTest.rows);
        
        // Count users
        const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
        console.log('👥 Nombre d\'users:', countResult.rows[0]);
        
        res.json({
            status: 'DB OK',
            timestamp: timeResult.rows[0].current_time,
            users_count: countResult.rows[0].total,
            table_structure: tableTest.rows
        });
        
    } catch (error) {
        console.error('❌ Test DB failed:', error);
        res.status(500).json({ 
            error: 'DB Error', 
            message: error.message,
            code: error.code 
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Serveur Render actif sur port ${port}`);
});