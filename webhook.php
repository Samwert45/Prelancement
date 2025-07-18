<?php
// Activer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

echo json_encode(['debug' => 'Script démarré']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    echo json_encode(['debug' => 'POST reçu', 'data' => $data]);
    
    $password = $_ENV['DB_PASSWORD'] ?? 'PASSWORD_MANQUANT';
    
    echo json_encode(['debug' => 'Password existe', 'exists' => !empty($password)]);
    
} else {
    echo json_encode(['error' => 'Pas POST']);
}
?>