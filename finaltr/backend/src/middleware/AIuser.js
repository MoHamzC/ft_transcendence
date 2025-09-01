import pool from '../config/db.js'

export async function createAIUser() {
  const client = await pool.connect();

  try {
    // Vérifier si les tables users et user_settings existent
    const tablesExist = await client.query(`
      SELECT
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')) as users_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings')) as settings_exists
    `);

    const { users_exists, settings_exists } = tablesExist.rows[0];

    if (!users_exists || !settings_exists) {
      console.log('Tables users ou user_settings n\'existent pas encore, skip création IA');
      return;
    }

    // Vérifier si l'utilisateur IA existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['IA']
    );

    if (existingUser.rows.length === 0) {
      // Commencer une transaction
      await client.query('BEGIN');

      try {
        // Créer l'utilisateur IA
        const userResult = await client.query(`
          INSERT INTO users (username, email, name, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id
        `, ['IA', 'ia@pong.local', 'Intelligence Artificielle']);

        const userId = userResult.rows[0].id;

        // Créer les settings pour l'IA
        await client.query(`
          INSERT INTO user_settings (user_id, pong_color)
          VALUES ($1, $2)
        `, [userId, 'brown']);

		await client.query(`
		INSERT INTO stats (user_id)
		VALUES ($1)
		`, [userId]);

        await client.query('COMMIT');
        console.log(`✅ Utilisateur IA créé avec l'ID: ${userId}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } else {
      console.log('ℹ️  Utilisateur IA existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur IA:', error.message);
  } finally {
    client.release();
  }
}
