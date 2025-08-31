// frontend/src/GDPRSettings.tsx - Interface GDPR OBLIGATOIRE
import { useState } from 'react';

export default function GDPRSettings() {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);
    
    const handleExportData = async () => {
        try {
            const protocol = window.location.protocol === 'https:' ? 'https' : 'https'; // Force HTTPS
            const response = await fetch(`${protocol}://localhost:3443/api/gdpr/export`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gdpr_export_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                alert('✅ Données exportées avec succès !');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            alert('❌ Erreur lors de l\'export des données');
            console.error('Export error:', error);
        }
    };
    
    const handleAnonymizeAccount = async () => {
        try {
            const protocol = window.location.protocol === 'https:' ? 'https' : 'https';
            const response = await fetch(`${protocol}://localhost:3443/api/gdpr/anonymize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    confirmation: 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE' 
                })
            });
            
            if (response.ok) {
                alert('✅ Compte anonymisé avec succès !');
                window.location.href = '/';
            } else {
                throw new Error('Anonymization failed');
            }
        } catch (error) {
            alert('❌ Erreur lors de l\'anonymisation');
            console.error('Anonymization error:', error);
        }
    };
    
    const handleDeleteAccount = async () => {
        try {
            const protocol = window.location.protocol === 'https:' ? 'https' : 'https';
            const response = await fetch(`${protocol}://localhost:3443/api/gdpr/account`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    confirmation: 'DELETE_MY_ACCOUNT_PERMANENTLY'
                })
            });
            
            if (response.ok) {
                alert('✅ Compte supprimé définitivement !');
                window.location.href = '/';
            } else {
                throw new Error('Deletion failed');
            }
        } catch (error) {
            alert('❌ Erreur lors de la suppression');
            console.error('Deletion error:', error);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">🔒 Paramètres GDPR</h1>
            <div className="text-sm text-gray-600 mb-8 text-center">
                Conformité RGPD - Articles 15 et 17
            </div>
            
            {/* Export données (Article 15) */}
            <div className="mb-6 p-6 border rounded-lg shadow-sm bg-blue-50">
                <h3 className="text-xl font-semibold mb-3 text-blue-800">📊 Droit d'accès (Article 15)</h3>
                <p className="mb-4 text-gray-700">
                    Exportez toutes vos données personnelles stockées dans notre système.
                    Vous recevrez un fichier JSON complet avec tous vos informations.
                </p>
                <button 
                    onClick={handleExportData}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    📥 Exporter mes données
                </button>
            </div>
            
            {/* Anonymisation */}
            <div className="mb-6 p-6 border rounded-lg shadow-sm bg-yellow-50">
                <h3 className="text-xl font-semibold mb-3 text-yellow-800">👤 Anonymisation du compte</h3>
                <p className="mb-4 text-gray-700">
                    Anonymise vos données personnelles tout en préservant les statistiques de jeu.
                    Votre compte sera renommé et vos informations personnelles supprimées.
                </p>
                <button 
                    onClick={() => setShowAnonymizeConfirm(true)}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                    🔒 Anonymiser mon compte
                </button>
            </div>
            
            {/* Suppression complète (Article 17) */}
            <div className="p-6 border-2 rounded-lg border-red-200 bg-red-50">
                <h3 className="text-xl font-semibold mb-3 text-red-800">
                    🗑️ Droit à l'effacement (Article 17)
                </h3>
                <p className="text-red-700 mb-4">
                    ⚠️ <strong>Action irréversible !</strong><br />
                    Supprime définitivement votre compte et toutes vos données.
                    Cette action ne peut pas être annulée.
                </p>
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    🗑️ Supprimer mon compte définitivement
                </button>
            </div>
            
            {/* Modal confirmation anonymisation */}
            {showAnonymizeConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4">⚠️ Confirmer l'anonymisation</h3>
                        <p className="mb-6 text-gray-700">
                            Cette action est irréversible. Votre compte sera anonymisé et vous ne pourrez plus récupérer vos données personnelles.
                        </p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAnonymizeAccount}
                                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                                Confirmer l'anonymisation
                            </button>
                            <button 
                                onClick={() => setShowAnonymizeConfirm(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal confirmation suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4 text-red-800">⚠️ Confirmer la suppression définitive</h3>
                        <p className="mb-6 text-red-700">
                            <strong>Cette action est irréversible et supprimera TOUTES vos données !</strong><br />
                            Votre compte, vos scores, vos amis et toutes vos informations seront perdus à jamais.
                        </p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Supprimer définitivement
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
