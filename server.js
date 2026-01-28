const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Melayani file frontend (HTML/CSS/JS) dari folder public
app.use(express.static(path.join(__dirname, "public")));

// =========================================================
// RUTE KHUSUS HALAMAN ADMIN (DARI FOLDER PRIVATE)
// =========================================================

// 1. Rute untuk membuka halaman Login
app.get("/masuk-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "login.html"));
});

// 2. Rute untuk membuka Dashboard
app.get("/dashboard-panel", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// =========================================================
// KONFIGURASI DATABASE (MENGGUNAKAN POOL)
// =========================================================
const db = mysql.createPool({
  host: "localhost",
  user: process.env.DB_USER || "kamparn1_admin",
  password: process.env.DB_PASSWORD || "@rengka123",
  database: process.env.DB_NAME || "kamparn1_bukutamu",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// PENTING: Cek koneksi menggunakan getConnection (Bukan db.connect)
// Ini opsional, hanya untuk memastikan credential benar saat server start
db.getConnection((err, connection) => {
  if (err) {
    console.error("GAGAL KONEK DATABASE:", err.message);
  } else {
    console.log("Berhasil terhubung ke Database MySQL via Pool");
    connection.release(); // PENTING: Kembalikan koneksi ke pool
  }
});

// =========================================================
// API PUBLIK (FORM TAMU)
// =========================================================

// Simpan data tamu baru
app.post("/api/tamu", (req, res) => {
  const { nama, alamat, jenis_kelamin, tujuan, uraian, no_hp } = req.body;

  // Pastikan kolom 'no_hp' sudah dibuat di database phpMyAdmin!
  const sql = `INSERT INTO tamu (nama, alamat, no_hp, jenis_kelamin, tujuan_keperluan, uraian_keperluan) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [nama, alamat, no_hp, jenis_kelamin, tujuan, uraian],
    (err, result) => {
      if (err) {
        console.error("Error Query Insert:", err); // Log error ke console server
        return res
          .status(500)
          .json({ error: "Gagal menyimpan data ke database. Cek Log Server." });
      }
      res.json({ message: "Data berhasil disimpan!", id: result.insertId });
    },
  );
});

// =========================================================
// API KHUSUS ADMIN
// =========================================================

// 1. Login Admin
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Username atau Password salah!" });
    }
  });
});

// 2. Ambil Semua Data Tamu (Untuk Dashboard)
app.get("/api/tamu", (req, res) => {
  const sql = "SELECT * FROM tamu ORDER BY waktu_kunjungan DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 3. Hapus Data Tamu (Delete)
app.delete("/api/tamu/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM tamu WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Gagal menghapus:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Data berhasil dihapus" });
  });
});

// =========================================================
// JALANKAN SERVER
// =========================================================

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
