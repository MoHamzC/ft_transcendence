// src/services/SettingsService.js

export class SettingsService
{
    static async getSettings(userId)
    {
        // TODO: fetch real settings from db
        return {
            theme: 'dark',
            notifications: true,
            language: 'fr'
        };
    }
}
