---
title: 'Install Nginx, MySQL, PHP di VPS Ubuntu'
description: >-
  Jika kalian menggunakan VPS, kalian perlu menginstal sendiri webserver,
  database, dan bahasa pemprograman yang akan digunakan di website kalian.
  Dengan…
excerpt: >-
  Jika kalian menggunakan VPS, kalian perlu menginstal sendiri webserver,
  database, dan bahasa pemprograman yang akan digunakan di website kalian.
  Dengan menggunakan VPS, kalian punya kebebasan penuh…
publishDate: 2021-09-09T00:00:00.000Z
hero: ./hero.png
heroAlt: 'Install Nginx, MySQL, PHP di VPS Ubuntu'
tags: []
category: info
draft: false
---

Jika kalian menggunakan VPS, kalian perlu menginstal sendiri webserver, database, dan bahasa pemprograman yang akan digunakan di website kalian. Dengan menggunakan VPS, kalian punya kebebasan penuh untuk memilih akan menginstal apa aja di virtual private server milikmu.

Website ini berjalan menggunakan CMS WordPress dan saya memilih menggunakan LEMP Stack (Linux, Nginx, MySQL, PHP) walau tergantung pada jenis webnya juga, sih, tapi saya lebih sering menggunakan LEMP dibanding LAMP (Linux, Apache, MySQL, PHP). Berikut ini cara install LEMP Stack di VPS Ubuntu.

## Install Nginx di Ubuntu

Secara default, webserver <a href="https://www.nginx.com">Nginx</a> sudah ada di repsitory Ubuntu yang bisa dengan mudah langsung menginstalnya dengan perintah `apt install`, tapi sayangnya software ini kurang update, hanya terdapat versi stabilnya aja. Karena itu, saya install Nginx melalui repository yang selalu up to date, yang kadang kala ada update minor untuk fitur, bugs, dan security.

Saya anggap kalian sudah mengerti [cara remote server menggunakan SSH](/blog/cara-menggunakan-ssh/) melalui terminal, ya. Jalankan perintah di bawah ini untuk install Nginx di Ubuntu.

```
sudo add-apt-repository ppa:nginx/development -y
```

```
sudo add-apt-repository ppa:nginx/development -y
```

Tunggu sampai prosesnya selesai, kemudian jalankan perintah di bawah ini untuk membarui daftar package di system.

```
sudo apt update
```

```
sudo apt update
```

Setelah update selesai, selanjutnya install Nginx di Ubuntu dengan perintah berikut.

```
sudo apt install nginx -y
```

```
sudo apt install nginx -y
```

Tunggu sampai proses instalasi selesai.

Jika proses install berjalan lancar, kalian bisa buka IP VPS di browser dan hasilnya akan terdapat tampilan halaman pemberitahuan tentang Nginx yang berhasil diinstal seperti gambar di bawah ini.

![welcome to nginx](./images/welcome-to-nginx.jpg 'Berhasil install Nginx')

## Install PHP-FPM di Ubuntu

Serupa seperti Nginx, <a href="https://www.php.net">PHP</a> juga sudah tersedia di repository Ubuntu, tapi jarang terdapat update. Akan lebih baik kita menggunakan PHP yang up to date. Jalankan perintah berikut.

```
sudo add-apt-repository ppa:ondrej/php -y
```

```
sudo add-apt-repository ppa:ondrej/php -y
```

Kemudian perbarui kembali package di system Linux.

```
sudo apt update
```

```
sudo apt update
```

Setelah update, saatnya install PHP versi 8.4 di Ubuntu dengan menjalankan perintah berikut.

```
sudo apt install php8.4-fpm php8.4-common php8.4-mysql php8.4-xml php8.4-xmlrpc php8.4-curl php8.4-gd php8.4-imagick php8.4-cli php8.4-dev php8.4-imap php8.4-mbstring php8.4-opcache php8.4-redis php8.4-soap php8.4-zip php8.4-intl -y
```

```
sudo apt install php8.4-fpm php8.4-common php8.4-mysql php8.4-xml php8.4-xmlrpc php8.4-curl php8.4-gd php8.4-imagick php8.4-cli php8.4-dev php8.4-imap php8.4-mbstring php8.4-opcache php8.4-redis php8.4-soap php8.4-zip php8.4-intl -y
```

Tunggu sampai proses instalasi selesai. Untuk memastikan PHP berhasil diinstal, jalankan perintah berikut.

```
php-fpm8.4 -v
```

Jika PHP berhasil diinstal, maka akan muncul output seperti di bawah ini.

```
PHP 8.4.11 (fpm-fcgi) (built: Aug  3 2025 08:42:27) (NTS)
Copyright (c) The PHP Group
Built by Debian
Zend Engine v4.4.11, Copyright (c) Zend Technologies
    with Zend OPcache v8.4.11, Copyright (c), by Zend Technologies
```

### Konfigurasi PHP

Setelah PHP berhasil diinstall, selanjutnya kita konfigurasi PHP terlebih dahulu sebelum melakukan instalasi database agar tidak ada kendala saat instalasi website WordPress. Edit file `php.ini` dengan menjalankan perintah berikut.

```
sudo nano /etc/php/8.4/fpm/php.ini
```

```
sudo nano /etc/php/8.4/fpm/php.ini
```

Cari `upload_max_filesize` dan `post_max_size` lalu ubah parameternya menjadi `64M`. Untuk mempercepat proses pencarian, gunakan shortcut **CTRL + W**.

Jangan lupa simpan perubahan dan cek apakah terdapat syntax error dengan menjalankan perintah berikut.

```
sudo php-fpm8.4 -t
```

Jika tidak ada kesalahan, maka akan mengasilkan output seperti di bawah ini.

```
NOTICE: configuration file /etc/php/8.4/fpm/php-fpm.conf test is successful
```

Selanjutnya restart PHP dengan menjalankan perintah berikut.

```
sudo systemctl restart php8.4-fpm
```

```
sudo systemctl restart php8.4-fpm
```

## Install MySQL di Ubuntu

Setelah selesai menginstal Nginx sebagai webserver dan PHP sebagai bahasa pemrograman, sekarang saatnya install <a href="https://www.mysql.com">MySQL</a> sebagai SQL database management system yang akan digunakan di website WordPress. MySQL merupakan salah satu software pengelola database SQL yang populer. Selain itu, ada juga MariaDB yang tidak kalah populernya dengan MySQL.

Saya memilih menggunakan MySQL aja karena...... Gapapa.  
Langsung aja install MySQL di VPS Ubuntu dengan mengetik perintah di bawah ini.

```
sudo apt install mysql-server -y
```

```
sudo apt install mysql-server -y
```

Tunggu sampai proses instalasi selesai dan setelah itu akan muncul prompt password database untuk user root. Kalau tidak muncul, tenang aja, tinggal jalankan perintah berikut.

Login ke MySQL.

```
sudo mysql
```

```
sudo mysql
```

Update password untuk user root.

```
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootpassword';
```

```
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootpassword';
```

Setelah logout dari MySQL dengan perintah `quit;` lalu jalankan perintah di bawah ini.

```
sudo mysql_secure_installation
```

```
sudo mysql_secure_installation
```

Dengan perintah di atas, akan muncul output untuk membuat password user root. Gunakan password yang kuat tapi mudah untuk diingat, ya! Catat kalau perlu, jangan sampai lupa! Selain itu juga ada beberapa konfigurasi lain yang diminta, hanya dengan memilih `y` atau `n`, sesuaikan aja dengan keinginan kalian.

## Menghapus Default Server Block Nginx

Langkah terakhir sebelum server ini siap digunakan untuk menjalankan website, sebaiknya kita menghapus default server block di Nginx agar kalau ada yang membuka IP VPS kita di browser, tidak akan muncul lagi halaman default welcome to Nginx seperti di atas tadi, tetapi akan muncul http error dengan kode 444.

Jalankan perintah di bawah ini untuk menghapus default server block Nginx.

```
sudo rm /etc/nginx/sites-available/default
```

```
sudo rm /etc/nginx/sites-available/default
```

Dan juga perintah ini.

```
sudo rm /etc/nginx/sites-enabled/default
```

```
sudo rm /etc/nginx/sites-enabled/default
```

Setelah itu, kita buat siapapun yang membuka IP server di browser akan mendapati halaman error 444. Buka file `nginx.conf` untuk diedit dengan perintah berikut.

```
sudo nano /etc/nginx/nginx.conf
```

```
sudo nano /etc/nginx/nginx.conf
```

Cari baris yang berisi `include /etc/nginx/sites-enabled/*;`  
Kemudian tambahkan kode berikut ini di bawahnya.

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}
```

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}
```

Jangan lupa simpan perubahan. Lalu cek apakah ada error pada konfigurasi Nginx tersebut dengan cara menjalankan perintah berikut.

```
sudo nginx -t
```

```
sudo nginx -t
```

Jika tidak ada error pada konfigurasi Nginx tersebut, akan muncul output seperti di bawah ini.

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Kalau semuanya sudah selesai, restart Nginx dengan perintah berikut.

```
sudo systemctl restart nginx
```

```
sudo systemctl restart nginx
```

Sekarang kalau ada yang buka IP server kita di browser, maka akan muncul halaman error 444. Coba aja buka IP VPS kalian di browser.

Demikian tutorial cara install Nginx, MySQL, PHP di VPS Ubuntu. Selanjutnya kita [migrasi WordPress dari shared hosting ke VPS](/blog/migrasi-shared-hosting-ke-vps/) yuk!
