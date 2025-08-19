// frontend/src/GDPRSettings.tsx - Interface utilisateur GDPR
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

interface GDPRConsent {
    has_consent: boolean;
    consent_date: string | null;
    policy_version: string | null;
    needs_update: boolean;
}

export default function GDPRSettings() {
    const { user } = useAuth();
    const [consentInfo, setConsentInfo] = useState<GDPRConsent | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState('privacy_concerns');

    useEffect(() => {
        fetchConsentInfo();
    }, []);

    const fetchConsentInfo = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/consent', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setConsentInfo(data.consent_status);
            }
        } catch (error) {
            console.error('Error fetching GDPR consent:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/export', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gdpr_export_${user?.id}_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                alert('✅ Vos données ont été exportées avec succès !');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('❌ Erreur lors de l\'export des données');
        }
    };

    const handleAnonymizeAccount = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/anonymize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    confirmation: 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE' 
                })
            });

            if (response.ok) {
                alert('✅ Votre compte a été anonymisé avec succès !');
                window.location.href = '/';
            } else {
                throw new Error('Anonymization failed');
            }
        } catch (error) {
            console.error('Error anonymizing account:', error);
            alert('❌ Erreur lors de l\'anonymisation');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    confirmation: 'DELETE_MY_ACCOUNT_PERMANENTLY',
                    reason: deleteReason
                })
            });

            if (response.ok) {
                alert('✅ Votre compte a été supprimé définitivement !');
                window.location.href = '/';
            } else {
                throw new Error('Account deletion failed');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('❌ Erreur lors de la suppression du compte');
        }
    };

    const handleConsentUpdate = async (consent: boolean) => {
        try {
            const response = await fetch('https://localhost:3443/api/gdpr/consent', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    gdpr_consent: consent,
                    privacy_policy_version: '1.0'
                })
            });

            if (response.ok) {
                await fetchConsentInfo();
                alert('✅ Consentement mis à jour !');
            }
        } catch (error) {
            console.error('Error updating consent:', error);
            alert('❌ Erreur lors de la mise à jour');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Chargement des paramètres GDPR...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                🔒 Paramètres GDPR & Confidentialité
            </h1>
            
            {/* Statut du consentement */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h2 className="text-xl font-semibold mb-4 text-blue-800">
                    📋 Statut du consentement GDPR
                </h2>
                {consentInfo && (
                    <div className="space-y-2">
                        <p><strong>Consentement :</strong> 
                            <span className={`ml-2 px-2 py-1 rounded ${
                                consentInfo.has_consent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {consentInfo.has_consent ? '✅ Donné' : '❌ Non donné'}
                            </span>
                        </p>
                        {consentInfo.consent_date && (
                            <p><strong>Date :</strong> {new Date(consentInfo.consent_date).toLocaleDateString()}</p>
                        )}
                        <p><strong>Version :</strong> {consentInfo.policy_version || 'Non définie'}</p>
                        
                        {consentInfo.needs_update && (
                            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                                <p className="text-yellow-800">
                                    ⚠️ Votre consentement doit être mis à jour pour la nouvelle politique de confidentialité.
                                </p>
                                <div className="mt-2 space-x-2">
                                    <button 
                                        onClick={() => handleConsentUpdate(true)}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        ✅ Accepter
                                    </button>
                                    <button 
                                        onClick={() => handleConsentUpdate(false)}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        ❌ Refuser
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Droits GDPR */}
            <div className="space-y-6">
                {/* Droit d'accès (Article 15) */}
                <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">📊 Droit d'accès (Article 15)</h3>
                    <p className="text-gray-600 mb-4">
                        Exportez toutes vos données personnelles dans un format lisible et portable.
                    </p>
                    <button 
                        onClick={handleExportData}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        📥 Exporter mes données
                    </button>
                </div>

                {/* Droit à l'anonymisation */}
                <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">👤 Anonymisation du compte</h3>
                    <p className="text-gray-600 mb-4">
                        Anonymise toutes vos données personnelles tout en préservant l'intégrité du système.
                    </p>
                    <button 
                        onClick={() => setShowAnonymizeConfirm(true)}
                        className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                        🔒 Anonymiser mon compte
                    </button>
                </div>

                {/* Droit à l'effacement (Article 17) */}
                <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                    <h3 className="text-lg font-semibold mb-2 text-red-800">🗑️ Droit à l'effacement (Article 17)</h3>
                    <p className="text-red-700 mb-4">
                        ⚠️ <strong>ATTENTION :</strong> Cette action est irréversible et supprimera définitivement votre compte.
                    </p>
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        🗑️ Supprimer mon compte
                    </button>
                </div>
            </div>

            {/* Modal de confirmation anonymisation */}
            {showAnonymizeConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4">⚠️ Confirmer l'anonymisation</h3>
                        <p className="mb-4">
                            Cette action va anonymiser toutes vos données personnelles. 
                            Vous ne pourrez plus accéder à votre compte avec vos identifiants actuels.
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

            {/* Modal de confirmation suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4 text-red-800">🗑️ Confirmer la suppression</h3>
                        <p className="mb-4 text-red-700">
                            <strong>ATTENTION :</strong> Cette action est irréversible et supprimera définitivement votre compte et toutes vos données.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Raison de la suppression :</label>
                            <select 
                                value={deleteReason} 
                                onChange={(e) => setDeleteReason(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="privacy_concerns">Préoccupations de confidentialité</option>
                                <option value="no_longer_needed">Plus besoin du service</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
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

            {/* Informations légales */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">📜 Vos droits GDPR</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <strong>Droit d'accès :</strong> Obtenir une copie de vos données</li>
                    <li>• <strong>Droit de rectification :</strong> Corriger vos données</li>
                    <li>• <strong>Droit à l'effacement :</strong> Supprimer vos données</li>
                    <li>• <strong>Droit à la portabilité :</strong> Transférer vos données</li>
                    <li>• <strong>Droit d'opposition :</strong> Vous opposer au traitement</li>
                </ul>
            </div>
        </div>
    );
}
