/**
 * Seed: Datos de demostración para departamentos y sensores RFID
 */

export async function seed(knex) {
  // 1. Limpiar tablas relacionadas (en orden por FKs)
  await knex('eventos_acceso').del();
  await knex('comandos_remotos').del();
  await knex('sensores').del();
  await knex('departamentos').del();

  // 2. Insertar departamentos de prueba
  const [dept101] = await knex('departamentos').insert([
    {
      id_departamento: 1,
      numero: '101',
      torre: 'Torre A',
      condominio: 'Condominio Los Pinos',
      piso: 1
    },
    {
      id_departamento: 2,
      numero: '202',
      torre: 'Torre A',
      condominio: 'Condominio Los Pinos',
      piso: 2
    },
    {
      id_departamento: 3,
      numero: '303',
      torre: 'Torre B',
      condominio: 'Condominio Los Pinos',
      piso: 3
    }
  ]).returning('id_departamento');

  console.log('✅ Departamentos demo creados');

  // 3. Actualizar usuario demo para ser ADMIN del departamento 101
  await knex('users')
    .where({ email: 'demo@example.com' })
    .update({
      rol: 'ADMIN',
      estado: 'ACTIVO',
      id_departamento: 1
    });

  console.log('✅ Usuario demo configurado como ADMIN del departamento 101');

  // 4. Insertar sensores RFID de prueba
  // IMPORTANTE: Estas MACs son de ejemplo. Debes reemplazarlas con las MACs reales
  // de tus tarjetas/llaveros RFID después de leerlas con el NodeMCU
  await knex('sensores').insert([
    {
      codigo_sensor: 'A1:B2:C3:D4',  // CAMBIAR por MAC real
      estado: 'ACTIVO',
      tipo: 'Tarjeta',
      id_departamento: 1,
      id_usuario_registro: 1,
      alias: 'Tarjeta Principal - Depto 101',
      fecha_alta: knex.fn.now()
    },
    {
      codigo_sensor: 'E5:F6:G7:H8',  // CAMBIAR por MAC real
      estado: 'ACTIVO',
      tipo: 'Llavero',
      id_departamento: 1,
      id_usuario_registro: 1,
      alias: 'Llavero Secundario - Depto 101',
      fecha_alta: knex.fn.now()
    },
    {
      codigo_sensor: 'AA:BB:CC:DD',  // CAMBIAR por MAC real
      estado: 'INACTIVO',
      tipo: 'Tarjeta',
      id_departamento: 2,
      alias: 'Tarjeta Inactiva - Depto 202',
      fecha_alta: knex.fn.now()
    },
    {
      codigo_sensor: '11:22:33:44',  // CAMBIAR por MAC real
      estado: 'BLOQUEADO',
      tipo: 'Llavero',
      id_departamento: 2,
      alias: 'Llavero Bloqueado - Depto 202',
      fecha_alta: knex.fn.now()
    }
  ]);

  console.log('✅ Sensores RFID demo creados');
  console.log('⚠️  IMPORTANTE: Reemplazar las MACs de ejemplo con las MACs reales de tus tarjetas RFID');
  console.log('   Para obtener las MACs, usa el Monitor Serie del Arduino IDE');
}
