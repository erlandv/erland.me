---
title: 'Tutorial Migrasi Website dari Shared Hosting ke VPS'
description: 'Bagaimana cara migrasi website dari shared hosting ke VPS? Ikuti tutorial ini untuk memindahkan website dari hosting ke VPS.'
excerpt: 'Dokumentasi sederhana tentang cara migrasi web dari shared hosting ke VPS'
publishDate: 2022-02-02
updatedDate: 2025-09-16
hero: ./hero.png
heroAlt: 'migrasi shared hosting ke vps'
category: 'Info'
draft: false
---

Kemarin ada teman yang minta dibantu untuk memindahkan web dari shared hosting ke VPS karena dia merasa shared hosting sudah tidak mampu lagi menangani jumlah pengunjung webnya. Selain minta bantu, dia juga sekaligus minta diajarkan caranya supaya paham dan menambah-nambah pengetahuan tentang VPS.

Saya sih mau-mau aja, senang kalau bisa membantu orang. Kemudian saya kepikiran untuk nulis artikel tentang cara pindah shared hosting ke VPS, di blog pribadi. Udah jarang update juga blog pribadi ini karena kesibukan mengurus moneysite. Jadi, yaudah, ayo kita mulai.

Di tutorial ini saya menggunakan <a href="https://www.domainesia.com/vm/">VPS murah Indonesia</a> dari DomaiNesia ya dengan OS Linux Ubuntu 20.04. Untuk dapat menjalankan website WordPress, kita memerlukan webserver, database management, dan bahasa pemrograman PHP. Saya memilih menggunakan LEMP Stack (Linux, Nginx, MySQL, PHP). Kalau kalian mau mengikuti pilihan saya, silakan kunjungi artikel Cara Install Nginx, MySQL, PHP di Ubuntu. Pastikan semuanya itu sudah terinstal sebelum mengikuti tutorial memindahkan website dari shared hosting ke VPS pada artikel ini.

## Backup Data Web di Shared Hosting

Langkah pertama untuk migrasi website antar server adalah melakukan backup data website yang akan dipindahkan dari server lama. Yang akan kita backup cukup file yang terdapat di public_html aja atau folder dari web yang akan dipindahkan, bukan semua yang ada di file manager.

![backup data web di file manager](./images/backup-data-web-di-file-manager.png 'backup data web di file manager')

Di shared hosting umumnya menggunakan cPanel sebagai kontrol panel. Berikut tahap-tahap cara backup data di file manager cPanel.

1. Buka file manager di cPanel.
2. Buka folder website yang akan dipindahkan. Jika hosting tersebut hanya diisi satu web, file-nya terdapat di `public_html`.
3. Select all file dan folder yang terdapat di `public_html` lalu klik kanan, kemudian pilih opsi compress.
4. Pada compression type, pilih Zip Archive.
5. Ubah nama menjadi `/public_html/backup.zip` agar mudah diingat lalu klik Compress Files.

Tunggu sampai proses compress selesai.

Jika sudah, selanjutnya kita akan backup database dari website yang akan dipindahkan.

:::gallery
![backup database di phpmyadmin](./images/backup-database-di-phpmyadmin.png 'Check all table'),
![export database di phpmyadmin](./images/export-database-di-phpmyadmin.png 'Export table from database')
:::

Berikut tahap-tahap cara backup database di phpMyAdmin.

1. Buka **phpMyAdmin** di cPanel.
2. Pilih database dari web yang akan dipindahkan.
3. **Check all** table di database tersebut.
4. Di menu **With selected**, pilih opsi **Export**.
5. Pada **Export Method**, pilih opsi **Quick**.
6. Pada menu format, pilih opsi **SQL**.
7. Klik tombol **Go**.

Setelah itu akan terunduh secara otomatis file database berformat `.sql` ke komputer kalian. Agar mudah dalam proses import di VPS nanti, ubah nama file menjadi `database.sql` dan compress file tersebut ke dalam format `.zip` lalu upload hasil compress zip ke root folder website di hosting lama. Kalau satu hosting hanya terdapat satu website, upload ke `public_html` agar mudah untuk di-download dari VPS nantinya, dan ubah namanya menjadi database.zip untuk semakin mempermudah jika kalian mengikuti tutorial ini.

Proses backup selesai. Lanjut ke langkah selanjutnya!

## Menyiapkan Virtual Private Server

Sebelum kita memindahkan file dan database yang tadi telah di-backup, terlebih dahulu kita siapkan tempat di VPS untuk menampung data-data website yang akan dipindahkan dan juga melakukan konfigurasi pada server block Nginx. Berikut ini beberapa langkah yang harus disiapkan.

### Membuat Root Directory

Kita perlu membuat folder yang akan menjadi tempat penyimpanan semua data website nantinya. Folder ini dikenal juga dengan root directory dari web kita, atau kalau di shared hosting tadi seperti `public_html`.

Akses/login VPS kalian menggunakan SSH di terminal linux atau PuTTy, lalu buatlah folder bernama domain.com dan html pada direktori `/var/www` dengan menjalankan perintah berikut.

```bash
sudo mkdir -p /var/www/domain.com/html
```

> NOTE: Nama domain.com itu hanya contoh, ya. Ganti dengan nama domain kalian!

Setelah folder tersebut berhasil dibuat, selanjutnya berikan akses foldernya ke user `www-data` dan group `$USER` dengan cara menjalankan perintah di bawah ini.

```bash
sudo chown -R www-data:$USER /var/www/domain.com/html
```

Setelah itu, ubah permission folder tersebut menjadi `755` dengan menjalankan perintah berikut.

```bash
sudo chmod -R 755 /var/www/domain.com/html
```

Nah, sekarang direktori `/var/www/domain.com/html` sudah siap untuk diisi dengan data/konten website yang akan dipindahkan dari shared hosting.

### Membuat Server Block

Setelah selesai membuat folder root directory untuk penyimpanan data website, selanjutnya kita akan membuat konfigurasi server block agar website kita nantinya bisa berjalan dengan webserver Nginx.

Di webserver Apache, kita mengenal virtual host. Sedangkan kalau di Nginx, file konfigurasi servernya dikenal dengan nama server block.

Buat file konfigurasi dengan nama domain.com pada direktori `/etc/nginx/sites-available` dengan menjalankan perintah di bawah ini.

```bash
sudo nano /etc/nginx/sites-available/domain.com
```

Perintah di atas akan membuka text editor nano untuk mengedit file konfigurasi yang dibuat. Isi dengan konfigurasi server berikut ini.

```nginx
server {
        listen 80;
        listen [::]:80;

        root /var/www/domain.com/html/;
        index index.php index.htm;

        server_name domain.com www.domain.com;

        access_log /var/log/nginx/domain.com.access.log;
        error_log /var/log/nginx/domain.com.error.log;

        location / {
                try_files $uri $uri/ /index.php?$args;
        }

        location ~ .php$ {
                include snippets/fastcgi-php.conf;
                include fastcgi_params;
                fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        }
}
```

Sekali lagi diingatkan, jangan lupa edit nama domain.com dengan domain kalian, ya. Setelah selesai, jangan lupa juga simpan perubahan. Kemudian aktifkan konfigurasi tersebut dengan cara menjalankan perintah di bawah ini.

```bash
sudo ln -s /etc/nginx/sites-available/domain.com /etc/nginx/sites-enabled/
```

Setelah itu kita tes apakah konfigurasi server block yang telah kita buat terdapat error atau tidak, caranya dengan menjalankan perintah berikut.

```bash
sudo nginx -t
```

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Kalau sudah oke semua, restart Nginx dengan perintah berikut.

```bash
sudo systemctl restart nginx
```

Sekarang server block Nginx siap untuk digunakan untuk website yang akan dipindahkan.

## Memindahkan Data Website ke VPS

Setelah backup data di hosting lama, membuat root directory, dan membuat server block di Nginx sudah selesai, selanjutnya langkah kita adalah memindahkan data website yang telah disiapkan tadi di shared hosting ke VPS. Caranya tentu tidak dengan men-download file tersebut lalu upload ke VPS, buang-buang waktu dan tenaga. Ada cara yang jauh lebih efektif, yaitu memanfaatkan perintah `wget`.

### Memindahkan Konten Website

Pertama-tama sebelum memulai, pastikan posisi kalian berada di root directory untuk website yang telah disiapkan tadi. Pindah direktori dengan perintah berikut.

```bash
cd /var/www/domain.com/html
```

Setelah itu jalankan perintah di bawah ini untuk memindahkan konten website dari shared hosting ke VPS.

```bash
sudo wget https://domain.com/backup.zip
```

File `backup.zip` tersebut merupakan file backup yang telah di-compress tadi pada langkah pertama dan diletakkan di `public_html` sebagai root directory di shared hosting. Kalau kalian memberi nama yang berbeda, tinggal sesuaikan aja, ya.

Tunggu sampai proses dari perintah tersebut selesai. Lama cepatnya tergantung pada besarnya ukuran file dan kecepatan VPS yang kalian gunakan.

Setelah prosesnya selesai, langkah berikutnya yaitu meng-extract file zip tersebut dengan perintah berikut.

```bash
unzip backup.zip
```

Kalau output-nya keluar `Command 'unzip' not found`, install dulu dengan perintah berikut.

```bash
sudo apt install unzip
```

Kalau sudah terinstal, lakukan extract file `backup.zip` tadi.

Kalau proses extract sudah selesai, lihat isi folder dari root directory dengan mengetik perintah `ls`. Output-nya akan menampilkan isi dari folder `/var/www/domain.com/html`. Kalau isinya terdapat banyak file dan folder seperti isi dari `public_html` di file manager shared hosting tadi, kalian tidak perlu melakukan apapun. Namun, kalau hanya terdapat folder `public_html`, itu berarti hasil extract ada di dalam folder tersebut. Pindahkan dengan perintah berikut.

```bash
sudo mv public_html/* /var/www/domain.com/html/
```

Sudah selesai? Selamat! Data-data file website kalian sudah berpindah dari shared hosting ke VPS.

Eh, tapi masih belum selesai. Website kalian masih belum bisa diakses karena belum ada database. Ikuti langkah selanjutnya untuk import database dari shared hosting ke VPS.

### Memindahkan Database

Tadi kita sudah export database melalui phpMyAdmin di shared hosting, compress file sql database tersebut menjadi zip, dan meng-upload ke folder root directory website di shared hosting. Sama seperti memindahkan data konten web, gunakan perintah wget untuk memindahkannya ke VPS.

```bash
sudo wget https://domain.com/database.zip
```

Setelah itu extract file tersebut.

```bash
unzip database.zip
```

Jika sudah, saatnya kita import database tersebut ke MySQL di VPS kita.

Umumnya sih orang lain menggunakan phpMyAdmin untuk mempermudah mengelola database, tapi di sini saya tidak menggunakannya karena saya merasa lebih seru aja mengelola database dengan CLI. Jadi di sini proses import database langsung dari terminal, ya. Jalankan perintah berikut untuk login ke MySQL.

```bash
sudo mysql -u root -p
```

Kalian akan diminta memasukan password MySQL untuk user `root`. Jangan bilang lupa, harus ingat ya password-nya yang dibuat saat proses instal MySQL.

![login ke mysql](./images/login-mysql.png 'login ke mysql')

Setelah memasukan password, kalian akan berhasil login ke MySQL. Selanjutnya kita akan membuat database baru untuk web yang akan di pindahkan.

Buat database baru dengan menjalankan perintah berikut.

```sql
CREATE DATABASE namadatabase;
```

Selanjutnya membuat user baru untuk mengelola database tersebut. Jalankan perintah berikut.

```sql
CREATE USER 'namauser'@'localhost' IDENTIFIED BY 'passworduser';
```

Supaya user baru tersebut memiliki hak akses ke database baru yang tadi dibuat, berikan privileges dengan menjalankan perintah berikut.

```sql
GRANT ALL PRIVILEGES ON namadatabase.* TO 'namauser'@'localhost';
```

Setelah itu flush privileges dengan menjalankan perintah di bawah.

```sql
FLUSH PRIVILEGES;
```

Selesai. Keluar dari console MySQL dengan menjalankan perintah quit.

```sql
QUIT;
```

Kita telah berhasil membuat database baru dan user baru serta memberikan akses privileges, selanjutnya kita akan import database yang tadi telah disiapkan dan berada di root directory web. Pastikan kalian berada di direktori tersebut. Kalau belum, jalankan perintah berikut untuk berpindah direktori.

```bash
cd /var/www/namadomain.com/html
```

Selanjutnya kita import database dengan menjalankan perintah di bawah ini.

```bash
mysql -u namauser -p namadatabase < database.sql
```

Kalian akan diminta password dari user baru yang tadi dibuat. Setelah itu tinggal tunggu aja sampai proses import selesai.

Sudah selesai? Mari kita pastikan bahwa database benar-benar berhasil di-import dengan cara melihat langsung isi database-nya. Login kembali ke MySQL dengan menjalankan perintah berikut.

```bash
mysql -u namauser -p
```

Setelah berhasil login, pilih database baru tadi dengan menjalankan perintah berikut.

```sql
USE namadatabase;
```

Lalu tampilkan isi database tersebut dengan menjalankan perintah berikut.

```sql
SHOW TABLES;
```

Gimana? Sudah sama isinya dengan isi database di hosting lama? Kalau sudah, selamat! Kalian berhasil melakukan import database dari shared hosting ke VPS.

Langkah selanjutnya pastikan ya nama database, user database, dan password user yang tadi baru dibuat sama dengan yang ada di konfigurasi WordPress. kalian bisa edit dengan menjalankan perintah berikut.

```bash
sudo nano wp-config.php
```

Sesuaikan `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` dengan yang baru. Exit setelah selesai dan jangan lupa simpan perubahan. Sampai di sini, urusan database selesai.

## Mengarahkan Domain ke VPS

Kita telah berhasil memindahkan data-data web dari shared hosting ke VPS. Agar website kita sepenuhnya bermigrasi ke VPS, sekarang kita arahkan domain ke VPS dengan mengedit DNS management.

Saya menyarankan untuk menggunakan DNS dari Cloudflare karena saya juga di sini menggunakan Cloudflare. Walau bisa aja sebenarnya kalau mau menggunakan DNS bawaan dari registrar atau tempat di mana kalian membeli domain. Caranya sama, pergi ke pengaturan DNS lalu ubah A record yang sebelumnya mengarah ke IP shared hosting menjadi mengarah ke IP dari VPS kalian. Kalau bingung, minta bantuan CS dari registrar tempat kalian membeli domain aja.

Lamanya proses pointing ini bervariasi, kalau saya yang menggunakan Cloudflare sih nggak sampai 5 menit hingga pointing mengarah sempurna ke IP VPS. Untuk memastikan domain sudah berpindah IP, jalankan saja perintah ping.

```bash
ping domain.com
```

Atau bisa juga memanfaatkan tools DNS Checker yang banyak bertebaran di internet.

Kalau IP-nya sudah berubah menjadi IP dari VPS kalian, itu berarti domain kalian sudah selesai propagasi ke server baru. Sampai di sini, selesai sudah proses pindah shared hosting ke VPS.

Eh, tapi, masih ada langkah tambahan, yaitu install SSL di VPS untuk domain kalian itu. Yuk lanjut!

## Install SSL di VPS dengan Certbot

Sudah tidak perlu dijelaskan lagi lah ya pentingnya menggunakan SSL. Tanpa banyak basa-basi, langsung aja kita instal SSL gratis dari Let’s Encrypt menggunakan Certbot di VPS Ubuntu.

Install Certbot dengan menjalankan perintah di bawah ini.

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Tunggu sampai proses instalasi selesai.
Kalau Certbot sudah terinstal, selanjutnya install SSL Let’s Encrypt ke domain kalian dengan menjalankan perintah berikut.

```bash
sudo certbot --nginx -d domain.com -d www.domain.com
```

Di tengah proses install, kita akan diberikan opsi untuk no redirect atau redirect semua request ke https. Pilih nomor 2 agar otomatis redirect ke https ketika ada yang mengakses dengan http. Setelah itu domain kalian berhasil diinstal SSL gratis dari Let’s Encrypt menggunakan Certbot.

## Konfigurasi GZIP Compression

Semua langkah-langkah di atas sudah membuat website kita sepenuhnya pindah ke server baru, sudah bisa diakses, dan sudah bisa dikelola kembali. Namun, masih ada satu langkah terakhir agar semuanya sempurna, yaitu konfigurasi GZIP Compression agar load website bisa lebih ngebut.

Langkah ini opsional aja sebenarnya, boleh diterapkan, boleh juga tidak. Saya sarankan sih terapkan aja.

Buka dan edit server block dengan menjalankan perintah berikut.

```bash
sudo nano /etc/nginx/sites-available/domain.com
```

Copy script di bawah ini dan paste di atas `location ~ .php$`.

```nginx
# GZIP Compression
gzip on;
gzip_disable "MSIE [1-6]\.(?!.*SV1)";
gzip_vary on;
gzip_types text/plain text/css text/javascript image/svg+xml image/x-ic>;
```

Berikut ini contohnya.

![GZIP Compression](./images/gzip-compression.png 'contoh GZIP Compression')

Setelah itu exit dan jangan lupa simpan perubahan, ya. Setelah setting GZIP Compression ini, dijamin load speed web kalian menjadi lebih ngebut dan tidak akan ada peringatan tentang GZIP di tools pengecek kecepatan web seperti GTmetrix dan Google PageSpeed Insights.

Nah, sekarang selesai sudah langkah-langkah seluruhnya. Tutorial cara pindah hosting ke VPS di artikel ini sudah selesai.
