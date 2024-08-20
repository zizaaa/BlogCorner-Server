import { Client } from "pg";
require('dotenv').config();

const client = new Client({
    user:process.env.PG_USER,
    host:process.env.PG_HOST,
    database:process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port:process.env.PG_PORT ? parseInt(process.env.PG_PORT) : undefined
})

client.connect()
.then(() => console.log('Connected to PostgreSQL'))
.catch(err => {
    console.error('Connection error', err);
    process.exit(1); // Exit the process if the connection fails
});

export default client;