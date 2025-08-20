#!/bin/sh
set -e

echo "🚀 Démarrage ft_transcendence HTTPS..."

# Créer le répertoire SSL s'il n'existe pas
mkdir -p /etc/nginx/ssl

# Générer les certificats SSL si ils n'existent pas
if [ ! -f "/etc/nginx/ssl/cert.pem" ]; then
    echo "🔐 Génération des certificats SSL..."
    /usr/local/bin/generate-ssl.sh
else
    echo "🔐 Certificats SSL existants trouvés"
fi

# Démarrer avec supervisor (nginx + backend)
echo "🌐 Démarrage des services..."
exec supervisord -c /etc/supervisord.conf
