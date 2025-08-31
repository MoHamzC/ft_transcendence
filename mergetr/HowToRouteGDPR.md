# 📋 Guide d'utilisation des Routes GDPR - ft_transcendence

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser les routes GDPR (RGPD) de l'API ft_transcendence. Toutes les routes sont conformes aux articles 15 et 17 du RGPD.

## 🔐 Authentification

**Toutes les routes sauf `/test` nécessitent une authentification JWT :**
```javascript
const headers = {
  'Authorization': 'Bearer <votre_jwt_token>',
  'Content-Type': 'application/json'
};
```

## 📚 Routes disponibles

### 1. 🧪 Route de test (pas d'authentification requise)

```http
GET /api/gdpr/test
```

**Description :** Vérifie que les routes GDPR fonctionnent
**Curl :**
```bash
curl -k https://localhost:5001/api/gdpr/test
```

**Réponse :**
```json
{
  "message": "GDPR Routes are working!",
  "available_routes": [
    "GET /api/gdpr/export (requires JWT auth)",
    "POST /api/gdpr/anonymize (requires JWT auth)",
    "DELETE /api/gdpr/account (requires JWT auth)",
    "GET /api/gdpr/test (this test route)"
  ],
  "gdpr_compliance": "Articles 15 & 17",
  "timestamp": "2025-08-31T00:53:39.449Z"
}
```

---

### 2. 📤 Export des données personnelles (Article 15)

```http
GET /api/gdpr/export
```

**Description :** Exporte toutes les données personnelles de l'utilisateur
**Authentification :** ✅ Requise
**Réponse :** Fichier JSON téléchargé automatiquement

**JavaScript (Frontend) :**
```javascript
const exportData = async () => {
  try {
    const response = await fetch('https://localhost:5001/api/gdpr/export', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + userToken
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Données exportées:', data);
      // Le fichier se télécharge automatiquement
    }
  } catch (error) {
    console.error('Erreur export:', error);
  }
};
```

**Curl :**
```bash
curl -k -H "Authorization: Bearer <token>" \
     https://localhost:5001/api/gdpr/export \
     -o gdpr_export.json
```

---

### 3. 🔒 Anonymisation du compte (Article 17)

```http
POST /api/gdpr/anonymize
```

**Description :** Anonymise toutes les données personnelles (nom, email, etc.)
**Authentification :** ✅ Requise
**⚠️ Action irréversible**

**Body requis :**
```json
{
  "confirmation": "I_UNDERSTAND_THIS_IS_IRREVERSIBLE"
}
```

**JavaScript (Frontend) :**
```javascript
const anonymizeAccount = async () => {
  const confirmed = confirm('⚠️ Cette action est IRRÉVERSIBLE ! Continuer ?');

  if (!confirmed) return;

  try {
    const response = await fetch('https://localhost:5001/api/gdpr/anonymize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirmation: 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE'
      })
    });

    const result = await response.json();
    console.log('Anonymisation:', result);
  } catch (error) {
    console.error('Erreur anonymisation:', error);
  }
};
```

**Curl :**
```bash
curl -k -X POST https://localhost:5001/api/gdpr/anonymize \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"confirmation": "I_UNDERSTAND_THIS_IS_IRREVERSIBLE"}'
```

---

### 4. 🗑️ Suppression du compte (Article 17)

```http
DELETE /api/gdpr/account
```

**Description :** Supprime définitivement le compte utilisateur
**Authentification :** ✅ Requise
**⚠️ Action définitive**

**Body requis :**
```json
{
  "confirmation": "DELETE_MY_ACCOUNT_PERMANENTLY",
  "reason": "privacy_concerns|no_longer_needed|other"
}
```

**JavaScript (Frontend) :**
```javascript
const deleteAccount = async () => {
  const confirmed = confirm('🚨 SUPPRESSION DÉFINITIVE ! Cette action ne peut pas être annulée. Continuer ?');

  if (!confirmed) return;

  const reason = prompt('Raison de la suppression:', 'privacy_concerns');

  try {
    const response = await fetch('https://localhost:5001/api/gdpr/account', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confirmation: 'DELETE_MY_ACCOUNT_PERMANENTLY',
        reason: reason
      })
    });

    const result = await response.json();
    console.log('Suppression:', result);

    // Rediriger vers la page d'accueil ou déconnecter
    logout();
  } catch (error) {
    console.error('Erreur suppression:', error);
  }
};
```

**Curl :**
```bash
curl -k -X DELETE https://localhost:5001/api/gdpr/account \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"confirmation": "DELETE_MY_ACCOUNT_PERMANENTLY", "reason": "privacy_concerns"}'
```

---

### 5. 📋 Vérification du consentement

```http
GET /api/gdpr/consent
```

**Description :** Vérifie le statut du consentement GDPR
**Authentification :** ✅ Requise

**JavaScript :**
```javascript
const checkConsent = async () => {
  try {
    const response = await fetch('https://localhost:5001/api/gdpr/consent', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + userToken
      }
    });

    const consent = await response.json();
    console.log('Consentement:', consent);
  } catch (error) {
    console.error('Erreur consentement:', error);
  }
};
```

---

### 6. ✏️ Mise à jour du consentement

```http
PUT /api/gdpr/consent
```

**Description :** Met à jour le consentement GDPR
**Authentification :** ✅ Requise

**Body requis :**
```json
{
  "gdpr_consent": true,
  "privacy_policy_version": "1.0"
}
```

**JavaScript :**
```javascript
const updateConsent = async (consent, policyVersion) => {
  try {
    const response = await fetch('https://localhost:5001/api/gdpr/consent', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gdpr_consent: consent,
        privacy_policy_version: policyVersion
      })
    });

    const result = await response.json();
    console.log('Consentement mis à jour:', result);
  } catch (error) {
    console.error('Erreur mise à jour:', error);
  }
};
```

## 🎯 Workflow recommandé

### Pour l'interface utilisateur :

1. **Page des paramètres de confidentialité :**
   - Bouton "Exporter mes données" → `GET /api/gdpr/export`
   - Bouton "Supprimer mon compte" → `DELETE /api/gdpr/account`
   - Case à cocher "J'accepte la politique de confidentialité" → `PUT /api/gdpr/consent`

2. **Gestion des erreurs :**
   ```javascript
   if (response.status === 401) {
     // Token expiré, rediriger vers login
     redirectToLogin();
   } else if (response.status === 400) {
     // Erreur de validation (confirmation manquante)
     showError('Confirmation requise');
   }
   ```

3. **Messages utilisateur :**
   - ✅ "Vos données ont été exportées avec succès"
   - ⚠️ "Cette action est irréversible"
   - 🚨 "Votre compte sera supprimé définitivement"

## 🔒 Sécurité

- Toutes les actions sont **loggées** pour l'audit
- Les confirmations sont **obligatoires** pour les actions destructives
- Les tokens JWT sont **validés** avant chaque action
- Les données sont **anonymisées** selon les standards GDPR

## 🧪 Tests

**Test rapide (sans auth) :**
```bash
curl -k https://localhost:5001/api/gdpr/test
```

**Test complet (avec auth) :**
```bash
# 1. Obtenir un token JWT
# 2. Tester l'export
curl -k -H "Authorization: Bearer <token>" https://localhost:5001/api/gdpr/export
```

---

*Document généré le 31 août 2025 - ft_transcendence API v1.0*
