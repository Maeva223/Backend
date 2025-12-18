import bcrypt from 'bcryptjs';

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('users').del();

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const empleadoHash = await bcrypt.hash('Empleado123!', 10);
  const demoHash = await bcrypt.hash('123456', 10);

  await knex('users').insert([
    {
      name: 'Administrador',
      last_name: 'Sistema',
      email: 'admin@example.com',
      password_hash: adminHash,
      rol: 'ADMIN',
      id_departamento: 1
    },
    {
      name: 'Empleado',
      last_name: 'Prueba',
      email: 'empleado@example.com',
      password_hash: empleadoHash,
      rol: 'OPERADOR',
      id_departamento: 2
    },
    {
      name: 'Demo',
      last_name: 'apellido',
      email: 'demo@example.com',
      password_hash: demoHash,
      rol: 'OPERADOR',
      id_departamento: 1
    }
  ]);
}
