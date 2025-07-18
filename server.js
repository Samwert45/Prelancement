const express = require('express');
const { Client } = require('pg');
const app = express();

app.use(express.json());
app.use(express.static('.'));

app.post('/webhook.php', async (req, res) => {
    console.log('=== DÉBUT WEBHOOK ===');
    console.log('Body:', req.body);
    console.log('DATABASE_URL défini:', !!process.env.DATABASE_URL);
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('Tentative de connexion...');
        await client.connect();
        console.log('✅ Connecté à PostgreSQL');
        
        console.log('Tentative d\'insertion...');
        const result = await client.query(
            'INSERT INTO users (email, created_at, source) VALUES ($1, $2, $3) RETURNING id',
            [req.body.email, new Date().toISOString(), 'gitanalyse']
        );
        console.log('✅ Email inséré, ID:', result.rows[0].id);
        
        await client.end();
        console.log('✅ Connexion fermée');
        
        res.json({ success: true, id: result.rows[0].id });
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        console.error('❌ Code:', error.code);
        
        try { await client.end(); } catch {}
        
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        database_url_set: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('🚀 Serveur démarré sur port', process.env.PORT || 3000);
    console.log('🔑 DATABASE_URL défini:', !!process.env.DATABASE_URL);
});