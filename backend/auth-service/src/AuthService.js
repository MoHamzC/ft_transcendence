export class AuthService
{
    static async logout(userId)
    {
        console.log(`🔒 [AuthService] User ${userId} logged out @ ${new Date().toISOString()}`);
    }
}
