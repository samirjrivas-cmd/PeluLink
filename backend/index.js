const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up storage for uploaded files into ../database/Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../database/Uploads/'));
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage: storage });

app.post('/api/salons/register', upload.fields([{ name: 'fachada', maxCount: 1 }, { name: 'barberos', maxCount: 1 }]), (req, res) => {
  try {
    const { nombreLocal, direccion, telefono } = req.body;
    const salonId = Date.now().toString();
    const fachadaFilename = req.files['fachada'] ? req.files['fachada'][0].filename : null;
    const barberosFilename = req.files['barberos'] ? req.files['barberos'][0].filename : null;

    const salonData = {
      id: salonId, nombreLocal, direccion, telefono, fachadaImg: fachadaFilename, createdAt: new Date().toISOString()
    };
    
    const salonsDir = path.join(__dirname, '../database/Salons');
    if (!fs.existsSync(salonsDir)) fs.mkdirSync(salonsDir, { recursive: true });
    fs.writeFileSync(path.join(salonsDir, `${salonId}.json`), JSON.stringify(salonData, null, 2));

    const staffData = {
      salonId: salonId, barberosImg: barberosFilename, asociadoA: nombreLocal, createdAt: new Date().toISOString()
    };
    const staffDir = path.join(__dirname, '../database/Staff');
    if (!fs.existsSync(staffDir)) fs.mkdirSync(staffDir, { recursive: true });
    fs.writeFileSync(path.join(staffDir, `${salonId}_staff.json`), JSON.stringify(staffData, null, 2));

    res.status(201).json({ message: 'Registrado correctamente', salonId });

  } catch (error) {
    console.error('Error guardando en la Base de Datos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const { nombreCliente, telefonoCliente, fecha, hora, servicio, profesional } = req.body;
    const appId = Date.now().toString();

    const appData = {
      id: appId,
      nombreCliente,
      telefonoCliente,
      fecha,
      hora,
      servicio,
      profesional,
      status: 'Confirmada',
      createdAt: new Date().toISOString()
    };

    const appsDir = path.join(__dirname, '../database/Appointments');
    if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir, { recursive: true });

    fs.writeFileSync(path.join(appsDir, `${appId}.json`), JSON.stringify(appData, null, 2));
    res.status(201).json({ message: 'Cita guardada correctamente', appId });
  } catch (error) {
    console.error('Error guardando cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/appointments', (req, res) => {
  try {
    const appsDir = path.join(__dirname, '../database/Appointments');
    if (!fs.existsSync(appsDir)) return res.json([]);
    const files = fs.readdirSync(appsDir);
    let appointments = [];
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(path.join(appsDir, file)));
        if (!req.query.profesional || data.profesional === req.query.profesional) {
          appointments.push(data);
        }
      }
    });
    // Sort from newest to oldest
    appointments.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(appointments);
  } catch(error) {
    console.error('Error getting appts:', error);
    res.status(500).json({ error: 'Error obteniendo citas' });
  }
});

app.patch('/api/appointments/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const appPath = path.join(__dirname, '../database/Appointments', `${id}.json`);
    if (!fs.existsSync(appPath)) return res.status(404).json({ error: 'Not found' });
    
    const data = JSON.parse(fs.readFileSync(appPath));
    data.status = 'Cancelada';
    fs.writeFileSync(appPath, JSON.stringify(data, null, 2));
    
    res.json({ message: 'Cancelada', appointment: data });
  } catch(error) {
    console.error('Error cancelling:', error);
    res.status(500).json({ error: 'Error cancelando cita' });
  }
});

app.get('/api/appointments/my-latest', (req, res) => {
  try {
    const appsDir = path.join(__dirname, '../database/Appointments');
    if (!fs.existsSync(appsDir)) return res.json(null);
    const files = fs.readdirSync(appsDir);
    let latest = null;

    files.forEach(file => {
      if (file.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(path.join(appsDir, file)));
        if (!latest || new Date(data.createdAt) > new Date(latest.createdAt)) {
          latest = data;
        }
      }
    });
    res.json(latest);
  } catch(error) {
    res.status(500).json({ error: 'Error fetching latest' });
  }
});

app.patch('/api/appointments/cancel-all/today', (req, res) => {
  try {
    const appsDir = path.join(__dirname, '../database/Appointments');
    if (!fs.existsSync(appsDir)) return res.json({ message: 'No hay citas para hoy' });
    
    const files = fs.readdirSync(appsDir);
    let count = 0;
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const appPath = path.join(appsDir, file);
        const data = JSON.parse(fs.readFileSync(appPath));
        if (data.status === 'Confirmada') {
          data.status = 'Cancelada';
          data.motivo = 'Cierre de emergencia';
          fs.writeFileSync(appPath, JSON.stringify(data, null, 2));
          count++;
        }
      }
    });

    res.json({ message: `Se cancelaron ${count} citas. Agenda Cerrada.` });
  } catch(error) {
    console.error('Error canceling all:', error);
    res.status(500).json({ error: 'Error cancelling all' });
  }
});

app.get('/', (req, res) => {
  res.send('PeluLink API is running y lista para agendar!');
});

app.listen(PORT, () => {
  console.log(`Backend Server is running perfectly on port ${PORT}`);
});
