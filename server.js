const express = require('express');
const { Client } = require('pg');
const app = express();

app.use(express.json());

// Route email
app.post('/webhook.php', async (req, res) => {
    const client = new Client({
        connectionString: `postgresql://gitivity_user:${process.env.DB_PASSWORD}@dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com:5432/gitivity`,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('Email reçu:', req.body.email);
        
        await client.connect();
        console.log('Connecté à PostgreSQL');
        
        await client.query(
            'INSERT INTO users (email, created_at, source) VALUES ($1, $2, $3)', 
            [req.body.email, new Date().toISOString(), 'gitanalyse']
        );
        console.log('Email inséré');
        
        await client.end();
        
        res.json({ success: true });
    } catch (error) {
        console.log('Erreur:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Serveur démarré');
});