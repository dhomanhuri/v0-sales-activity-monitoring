# Panduan Testing Monthly Revenue (Closing)

## Prerequisites
1. Login ke aplikasi (Admin, GM, atau Sales)
2. Pastikan sudah ada Campaign yang dibuat
3. Pastikan sudah ada Master Customer yang dibuat

## Step-by-Step Testing

### Test Case 1: Basic Monthly Revenue Display

**Steps:**
1. Buka menu **AM** → Pilih Sales → Pilih Campaign
2. Klik **"Add Activity"**
3. Isi form:
   - **Customer**: Pilih customer
   - **Activity**: Pilih **"Closing"**
   - **Activity Date**: Pilih tanggal di bulan Januari (contoh: 2024-01-15)
   - **Potential Value**: Masukkan nilai, misalnya `1000000`
   - **Description**: (opsional)
   - **PIC**: (opsional)
4. Klik **"Save"**
5. Ulangi langkah 2-4 untuk bulan yang berbeda:
   - Februari: `2000000`
   - Maret: `1500000`
   - April: `3000000`
6. Kembali ke **Dashboard**
7. Scroll ke bagian **"Monthly Revenue (Closing)"**
8. Pastikan dropdown **"Year"** menunjukkan tahun yang sesuai (contoh: 2024)

**Expected Result:**
- Grafik menampilkan bar chart dengan 12 kolom (Jan-Dec)
- Kolom Januari menunjukkan tinggi sesuai dengan nilai 1.000.000
- Kolom Februari menunjukkan tinggi sesuai dengan nilai 2.000.000
- Kolom Maret menunjukkan tinggi sesuai dengan nilai 1.500.000
- Kolom April menunjukkan tinggi sesuai dengan nilai 3.000.000
- Bulan lainnya (Mei-Des) menunjukkan 0 atau tidak ada bar

### Test Case 2: Multiple Closing Activities in Same Month

**Steps:**
1. Di Campaign yang sama, tambahkan beberapa aktivitas Closing di bulan yang sama
   - Closing 1: Januari 2024, Potential Value: `1000000`
   - Closing 2: Januari 2024, Potential Value: `500000`
   - Closing 3: Januari 2024, Potential Value: `750000`
2. Kembali ke Dashboard
3. Lihat grafik Monthly Revenue

**Expected Result:**
- Kolom Januari menunjukkan total: 2.250.000 (1.000.000 + 500.000 + 750.000)
- Nilai dijumlahkan untuk bulan yang sama

### Test Case 3: Year Filter

**Steps:**
1. Buat aktivitas Closing dengan tanggal tahun 2023
2. Buat aktivitas Closing dengan tanggal tahun 2024
3. Di Dashboard, ubah dropdown **"Year"** ke 2023
4. Lihat grafik
5. Ubah dropdown **"Year"** ke 2024
6. Lihat grafik lagi

**Expected Result:**
- Saat memilih tahun 2023, hanya menampilkan data Closing tahun 2023
- Saat memilih tahun 2024, hanya menampilkan data Closing tahun 2024
- Data tidak tercampur antar tahun

### Test Case 4: Empty State (No Closing Activities)

**Steps:**
1. Buat Campaign baru tanpa aktivitas Closing
2. Atau pilih tahun yang tidak memiliki aktivitas Closing
3. Lihat grafik Monthly Revenue

**Expected Result:**
- Menampilkan pesan: **"No revenue for this year yet."**
- Tidak ada bar chart yang ditampilkan

### Test Case 5: Hover Tooltip

**Steps:**
1. Pastikan ada data Closing di beberapa bulan
2. Hover mouse ke bar chart di grafik Monthly Revenue

**Expected Result:**
- Tooltip muncul menampilkan nilai dalam format: `Rp 1.000.000` (dengan format Indonesia)
- Tooltip menunjukkan nilai yang akurat sesuai dengan data

### Test Case 6: Different Roles (Admin vs GM vs Sales)

**Admin Dashboard:**
- Menampilkan semua Closing activities dari semua Sales
- Grafik mencakup semua campaign di sistem

**GM Dashboard:**
- Menampilkan Closing activities hanya dari Sales di bawah GM tersebut
- Grafik hanya mencakup campaign dari tim GM

**Sales Dashboard:**
- Menampilkan Closing activities hanya dari Sales tersebut
- Grafik hanya mencakup campaign milik Sales tersebut

## Data Test yang Disarankan

Untuk testing yang lebih mudah, gunakan data berikut:

| Bulan | Tanggal | Potential Value | Customer |
|-------|---------|----------------|----------|
| Januari | 2024-01-15 | 1.000.000 | Customer A |
| Februari | 2024-02-20 | 2.000.000 | Customer B |
| Maret | 2024-03-10 | 1.500.000 | Customer A |
| April | 2024-04-05 | 3.000.000 | Customer C |
| Mei | 2024-05-25 | 2.500.000 | Customer B |
| Juni | 2024-06-12 | 1.800.000 | Customer A |

## Troubleshooting

**Problem: Grafik tidak muncul**
- Pastikan aktivitas yang dibuat adalah jenis "Closing"
- Pastikan "Potential Value" sudah diisi (wajib untuk Closing)
- Pastikan "Activity Date" sudah diisi
- Pastikan tahun di dropdown sesuai dengan tahun aktivitas

**Problem: Nilai tidak akurat**
- Pastikan hanya aktivitas "Closing" yang dihitung
- Pastikan "Potential Value" diisi dengan angka yang valid
- Pastikan "Activity Date" sesuai dengan bulan yang diinginkan

**Problem: Grafik tidak update setelah menambah aktivitas**
- Refresh halaman dashboard
- Pastikan aktivitas sudah tersimpan dengan benar

## Notes

- Monthly Revenue hanya menghitung aktivitas dengan jenis **"Closing"**
- Aktivitas jenis lain (Initiate Call, Presentation, Demo, dll) tidak dihitung
- Nilai dihitung berdasarkan `potential_value` dari aktivitas Closing
- Bulan ditentukan dari field `tanggal_aktivitas`
- Grafik menampilkan 12 bulan (Januari = 1, Desember = 12)

