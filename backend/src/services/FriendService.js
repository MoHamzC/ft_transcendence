// src/services/FriendService.js

export class FriendService
{
    static async listFriends(userId)
    {
        // TODO: fetch real friends from db
        return [
            { id: 5, email: 'friend1@42.fr' },
            { id: 6, email: 'friend2@42.fr' }
        ];
    }
}
