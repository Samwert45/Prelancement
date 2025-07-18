<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// LOG 1: Vérifier que le script est appelé
error_log("📝 Script PHP appelé - Method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // LOG 2: Vérifier les données reçues
    $input = file_get_contents('php://input');
    error_log("📝 Données reçues: " . $input);
    
    $data = json_decode($input, true);
    error_log("📝 JSON décodé: " . print_r($data, true));
   
    $dsn = "pgsql:host=dpg-d1t8690d13ps7396dnj0-a.oregon-postgres.render.com;port=5432;dbname=gitivity;sslmode=require";
    $username = "gitivity_user";
    $password = $_ENV['DB_PASSWORD'];
   
    try {
        // LOG 3: Tentative de connexion
        error_log("📝 Tentative de connexion DB...");
        $pdo = new PDO($dsn, $username, $password);
        error_log("📝 Connexion DB réussie !");
       
        // LOG 4: Tentative d'insertion
        error_log("📝 Insertion: " . $data['email'] . " - " . $data['date']);
        $stmt = $pdo->prepare("INSERT INTO users (email, created_at, source) VALUES (?, ?, ?)");
        $result = $stmt->execute([
            $data['email'],
            $data['date'],
            $data['source'] ?? 'gitanalyse'
        ]);
        
        error_log("📝 Résultat insertion: " . ($result ? "SUCCESS" : "FAILED"));
       
        echo json_encode(['success' => true, 'message' => 'Email sauvegardé dans users']);
    } catch (Exception $e) {
        error_log("❌ Erreur PHP: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    error_log("📝 Méthode non POST: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
?>