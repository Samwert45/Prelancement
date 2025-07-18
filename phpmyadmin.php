<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $dsn = "pgsql:host=dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com;port=5432;dbname=gitivity;sslmode=require";
    $username = "gitivity_user";
    $password = "";
    
    try {
        $pdo = new PDO($dsn, $username, $password);
        
        $stmt = $pdo->prepare("INSERT INTO emails (email, created_at, source) VALUES (?, ?, ?)");
        $stmt->execute([
            $data['email'],
            $data['date'],
            $data['source']
        ]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>