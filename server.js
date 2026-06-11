const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de conexión a Azure SQL
const dbConfig = {
  user: 'Colomos2025',
  password: 'GTcartel07#',
  server: 'techsolutions-db.database.windows.net',
  database: 'techsolutions-db',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Conectar a la base de datos
let pool;
async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Conectado a Azure SQL Database');
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
}
connectDB();

// ==================== CLIENTES ====================

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Clientes ORDER BY fecha_registro DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear cliente
app.post('/api/clientes', async (req, res) => {
  const { nombre, empresa, telefono, correo, direccion } = req.body;
  try {
    await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .input('empresa', sql.VarChar, empresa)
      .input('telefono', sql.VarChar, telefono)
      .input('correo', sql.VarChar, correo)
      .input('direccion', sql.VarChar, direccion)
      .query('INSERT INTO Clientes (nombre, empresa, telefono, correo, direccion) VALUES (@nombre, @empresa, @telefono, @correo, @direccion)');
    res.json({ message: 'Cliente registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TECNICOS ====================

// Obtener todos los técnicos
app.get('/api/tecnicos', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Tecnicos');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear técnico
app.post('/api/tecnicos', async (req, res) => {
  const { nombre, especialidad, correo } = req.body;
  try {
    await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .input('especialidad', sql.VarChar, especialidad)
      .input('correo', sql.VarChar, correo)
      .query('INSERT INTO Tecnicos (nombre, especialidad, correo) VALUES (@nombre, @especialidad, @correo)');
    res.json({ message: 'Técnico registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TICKETS ====================

// Obtener todos los tickets con nombre de cliente y técnico
app.get('/api/tickets', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT t.*, c.nombre as cliente_nombre, c.empresa, te.nombre as tecnico_nombre
      FROM Tickets t
      LEFT JOIN Clientes c ON t.cliente_id = c.id
      LEFT JOIN Tecnicos te ON t.tecnico_id = te.id
      ORDER BY t.fecha_creacion DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear ticket
app.post('/api/tickets', async (req, res) => {
  const { cliente_id, tecnico_id, titulo, descripcion, prioridad } = req.body;
  try {
    await pool.request()
      .input('cliente_id', sql.Int, cliente_id)
      .input('tecnico_id', sql.Int, tecnico_id)
      .input('titulo', sql.VarChar, titulo)
      .input('descripcion', sql.Text, descripcion)
      .input('prioridad', sql.VarChar, prioridad)
      .query('INSERT INTO Tickets (cliente_id, tecnico_id, titulo, descripcion, prioridad) VALUES (@cliente_id, @tecnico_id, @titulo, @descripcion, @prioridad)');
    res.json({ message: 'Ticket creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar estado de ticket
app.put('/api/tickets/:id', async (req, res) => {
  const { estado } = req.body;
  try {
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('estado', sql.VarChar, estado)
      .query('UPDATE Tickets SET estado = @estado, fecha_actualizacion = GETDATE() WHERE id = @id');
    res.json({ message: 'Ticket actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial de tickets por cliente
app.get('/api/tickets/cliente/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT t.*, te.nombre as tecnico_nombre
        FROM Tickets t
        LEFT JOIN Tecnicos te ON t.tecnico_id = te.id
        WHERE t.cliente_id = @id
        ORDER BY t.fecha_creacion DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
