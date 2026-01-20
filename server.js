// server.js
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Melayani file umum (Tamu)

// =========================================================
// RUTE KHUSUS HALAMAN ADMIN (DARI FOLDER PRIVATE)
// =========================================================

// 1. Rute untuk membuka halaman Login
// Akses di browser: http://localhost:3000/masuk-admin
app.get("/masuk-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "login.html"));
});

// 2. Rute untuk membuka Dashboard
// Akses di browser: http://localhost:3000/dashboard-panel
app.get("/dashboard-panel", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// =========================================================

// Konfigurasi Database
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Sesuaikan user MySQL Anda
  password: "", // Sesuaikan password MySQL Anda
  database: "db_bukutamu",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Terhubung ke Database MySQL");
});

// API untuk menyimpan data tamu
app.post("/api/tamu", (req, res) => {
  // Tambahkan no_hp di sini
  const { nama, alamat, jenis_kelamin, tujuan, uraian, no_hp } = req.body;

  // Update Query SQL
  const sql = `INSERT INTO tamu (nama, alamat, no_hp, jenis_kelamin, tujuan_keperluan, uraian_keperluan) VALUES (?, ?, ?, ?, ?, ?)`;

  // Masukkan no_hp ke dalam array data
  db.query(
    sql,
    [nama, alamat, no_hp, jenis_kelamin, tujuan, uraian],
    (err, result) => {
      if (err) {
        console.error(err); // Log error di terminal agar mudah debug
        return res
          .status(500)
          .json({ error: "Gagal menyimpan data ke database" });
      }
      res.json({ message: "Data berhasil disimpan!", id: result.insertId });
    },
  );
});

// --- ADMIN API ---

// 1. API Login (MENGGUNAKAN DATABASE)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Query untuk mencari user yang cocok
  const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    // Jika ditemukan data yang cocok (results.length > 0)
    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Username atau Password salah!" });
    }
  });
});

// 2. API Ambil Semua Data Tamu (Untuk Dashboard)
app.get("/api/tamu", (req, res) => {
  // Ambil data diurutkan dari yang terbaru
  const sql = "SELECT * FROM tamu ORDER BY waktu_kunjungan DESC";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log(`Login Admin di: http://localhost:${port}/masuk-admin`);
});
