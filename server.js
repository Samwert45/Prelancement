const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Route webhook
app.post('/webhook.php', async (req, res) => {
    try {
        const { email, date, source } = req.body;
        
        const client = new Client({
            connectionString: `postgresql://gitivity_user:${process.env.DB_PASSWORD}@dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com:5432/gitivity`,
            ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        
        await client.query(
            'INSERT INTO users (email, created_at, source) VALUES ($1, $2, $3)',
            [email, date, source || 'gitanalyse']
        );
        
        await client.end();
        
        res.json({ success: true, message: 'Email sauvegardé' });
        
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});