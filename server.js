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

// Route webhook corrigée
app.post('/webhook.php', async (req, res) => {
    console.log('📧 Nouvelle demande:', req.body);
    
    try {
        const { email, date, source } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email requis' });
        }
        
        // Utilisation du pool (plus stable que Client)
        const result = await pool.query(
            'INSERT INTO users (email, created_at, source) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
            [email, date || new Date().toISOString(), source || 'gitanalyse']
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Email sauvegardé:', email);
            res.json({ success: true, message: 'Email sauvegardé' });
        } else {
            console.log('⚠️ Email déjà existant:', email);
            res.json({ success: true, message: 'Email déjà enregistré' });
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Health check pour Render
app.get('/', (req, res) => {
    res.json({ status: 'OK', service: 'Gitanalyse webhook' });
});

app.listen(port, () => {
    console.log(`🚀 Serveur Render actif sur port ${port}`);
});