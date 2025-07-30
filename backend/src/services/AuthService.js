// src/services/AuthService.js

export class AuthService
{
    static async logout(userId)
    {
        // ici on pourrait invalider un token, ou simplement logguer l'action
        console.log(`User ${userId} logged out.`);
    }
}
