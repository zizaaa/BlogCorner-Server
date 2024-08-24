import client from "../config/db.config";

export async function tokenTable() {
    const tokenQeury = `
    CREATE TABLE IF NOT EXISTS tokens (
    access_token VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `

    try {
        await client.query(tokenQeury)
        console.log('Token table created')
    } catch (error) {
        console.error(error)
    }
}