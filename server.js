const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Pool de connexions PostgreSQL pour Render
const pool = new Pool({
    connectionString: `postgresql://gitivity_user:${process.env.DB_PASSWORD}@dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com:5432/gitivity`,
    ssl: { rejectUnauthorized: false },
    max: 10, // max 10 connexions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Route webhook avec debug complet
app.post('/webhook.php', async (req, res) => {
    console.log('🚀 === DÉBUT WEBHOOK ===');
    console.log('📧 Body reçu:', JSON.stringify(req.body, null, 2));
    console.log('🔗 Headers:', req.headers);
    
    try {
        const { email, date, source } = req.body;
        console.log('📝 Variables extraites:', { email, date, source });
        
        if (!email) {
            console.log('❌ Email manquant');
            return res.status(400).json({ error: 'Email requis' });
        }
        
        console.log('🔌 Test de connexion au pool...');
        
        // Test simple de connexion
        await pool.query('SELECT NOW()');
        console.log('✅ Connexion pool OK');
        
        console.log('💾 Exécution de la requête INSERT...');
        const result = await pool.query(
            'INSERT INTO users (email, created_at, source) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
            [email, date || new Date().toISOString(), source || 'gitanalyse']
        );
        
        console.log('📊 Résultat requête:', result.rows);
        
        if (result.rows.length > 0) {
            console.log('✅ Nouvel email sauvegardé:', email, 'ID:', result.rows[0].id);
            res.json({ success: true, message: 'Email sauvegardé', id: result.rows[0].id });
        } else {
            console.log('⚠️ Email déjà existant:', email);
            res.json({ success: true, message: 'Email déjà enregistré', already_exists: true });
        }
        
        console.log('🎉 === FIN WEBHOOK SUCCESS ===');
        
    } catch (error) {
        console.error('💥 === ERREUR WEBHOOK ===');
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error detail:', error.detail);
        console.error('💥 === FIN ERREUR ===');
        
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: error.message,
            code: error.code 
        });
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