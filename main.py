import subprocess
import os
import signal
import sys

def signal_handler(sig, frame):
    print('Arrêt du serveur PHP...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    port = os.environ.get('PORT', 8000)
    print(f"Démarrage du serveur PHP sur le port {port}")
    
    # Lancer le serveur PHP
    try:
        subprocess.run(['php', '-S', f'0.0.0.0:{port}'], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors du démarrage du serveur PHP: {e}")
        sys.exit(1)