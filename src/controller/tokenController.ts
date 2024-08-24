import { QueryResult } from "pg";
import client from "../config/db.config"

export async function insertToken(token:string): Promise<string>{
    const insertTokenQuery = `
        INSERT INTO tokens
        (access_token)
        VALUES ($1)
        RETURNING *;
    `
    try {
        await client.query(insertTokenQuery,[token]);
        console.log('Success storing token.');
        return 'success';
    } catch (error) {
        console.error(error);
        return 'Error storing token.';
    }
}

export async function getToken(token: string): Promise<QueryResult | string> {
    const getTokenQuery = `
        SELECT access_token
        FROM tokens
        WHERE access_token = $1
    `;

    try {
        const result = await client.query(getTokenQuery, [token]);

        if (result.rows.length === 0) {
            return 'Token not found';
        }

        return result;
    } catch (error) {
        console.error('Error retrieving token:', error);
        return 'Error retrieving token';
    }
}

export async function deleteToken(token:string): Promise<string>{
    const deleteTokenQuery = `
        DELETE FROM tokens
        WHERE access_token = $1
    `;

    try {
        await client.query(deleteTokenQuery,[token]);
        console.log('Success deleting token.');
        return 'success';
    } catch (error) {
        console.error(error);
        return 'Error deleting token';
    }
}