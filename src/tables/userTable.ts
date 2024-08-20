import client from "../config/db.config";

// Create the users table first
export async function createUserTable() {
    const createQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        middleName VARCHAR(50),
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    await client.query(createQuery);
    console.log('Users table created successfully');
}

// Create the blogs table
export async function createBlogsTable() {
    const createQuery = `
    CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        cover_img VARCHAR(255),
        up_vote INT,
        down_vote INT,
        owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    `;
    await client.query(createQuery);
    console.log('Blogs table created successfully');
}

// Create the bookmarks table
export async function createBookmarksTable() {
    const createQuery = `
    CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        saved_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    `;
    await client.query(createQuery);
    console.log('Bookmarks table created successfully');
}

// Main function to create all tables
export async function createTables() {
    try {
        // First, ensure the users table is created
        await createUserTable();
        // Then, create the blogs and bookmarks tables
        await createBlogsTable();
        await createBookmarksTable();

        console.log('Tables created')
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}
