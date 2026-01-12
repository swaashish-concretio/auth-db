import pool from '../config/database.js';

export const createUser = async (email, hashedPassword, name) => {
  const query = 'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at';
  const values = [email, hashedPassword, name];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

export const findUserById = async (id) => {
  const query = 'SELECT id, email, name, created_at FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
