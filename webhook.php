<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
   
    $dsn = "pgsql:host=dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com;port=5432;dbname=gitivity;sslmode=require";
    $username = "gitivity_user";  // ← CORRIGÉ !
    $password = $_ENV['DB_PASSWORD'];
   
    try {
        $pdo = new PDO($dsn, $username, $password);
       
        $stmt = $pdo->prepare("INSERT INTO users (email, created_at) VALUES (?, ?)");
        $stmt->execute([
            $data['email'],
            $data['date']
        ]);
       
        echo json_encode(['success' => true, 'message' => 'Email sauvegardé dans users']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
?>