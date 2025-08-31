# 📁 Scripts - Organisation Centralisée

## 🎯 Vue d'ensemble

Tous les scripts du projet sont maintenant centralisés dans ce dossier `scripts/` pour une meilleure organisation et maintenance.

## 📋 Scripts Disponibles

### 🚀 Scripts de Démarrage
- **`start-robust.sh`** - Démarrage one-click automatique avec initialisation complète
- **`init-database.sh`** - Initialisation automatique de la base de données
- **`init-vault-auto.sh`** - Initialisation automatique de Vault et des secrets

### 🧪 Scripts de Test
- **`test-ft-transcendence.sh`** - Tests complets automatiques (28 tests)

### 🔒 Scripts de Sécurité
- **`audit-security.sh`** - Audit de sécurité complet

### 🛠️ Utilitaires
- **`open-adminer.sh`** - Ouvrir Adminer dans le navigateur

## 🎮 Utilisation Rapide

```bash
# Depuis le répertoire racine (liens symboliques)
./start-robust.sh          # Démarrage complet
./test-ft-transcendence.sh # Tests complets
./audit-security.sh        # Audit sécurité

# Depuis le dossier scripts/
cd scripts/
./start-robust.sh          # Démarrage complet
./test-ft-transcendence.sh # Tests complets
```

## 🔗 Liens Symboliques

Des liens symboliques ont été créés dans le répertoire racine pour maintenir la compatibilité :
- `start-robust.sh` → `scripts/start-robust.sh`
- `test-ft-transcendence.sh` → `scripts/test-ft-transcendence.sh`
- `audit-security.sh` → `scripts/audit-security.sh`
- `open-adminer.sh` → `scripts/open-adminer.sh`

## 📊 Statistiques

- **Total scripts** : 6
- **Scripts de démarrage** : 3
- **Scripts de test** : 1
- **Scripts de sécurité** : 1
- **Utilitaires** : 1

## 🎯 Workflow Recommandé

```bash
# 1. Démarrage complet
./start-robust.sh

# 2. Tests de validation
./test-ft-transcendence.sh

# 3. Audit sécurité (optionnel)
./audit-security.sh
```

## 🔧 Maintenance

Tous les scripts sont :
- ✅ **Exécutables** (`chmod +x`)
- ✅ **Documentés** (headers avec description)
- ✅ **Testés** (intégration validée)
- ✅ **Centralisés** (organisation logique)

---

**📁 Organisation : 6 scripts essentiels, zéro duplication !** ✨
