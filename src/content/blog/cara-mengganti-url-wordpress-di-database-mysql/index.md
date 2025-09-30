---
title: Cara Mengganti URL WordPress di Database MySQL
description: >-
  Hanya sebuah dokumentasi sederhana tentang cara mengubah URL website yang dibangun menggunakan WordPress di database MySQL dengan CLI.
excerpt: >-
  Hanya sebuah dokumentasi sederhana tentang cara mengubah URL website yang dibangun menggunakan WordPress di database MySQL dengan CLI.
publishDate: 2022-08-25T00:00:00.000Z
hero: ./hero.png
heroAlt: Cara Mengganti URL WordPress di Database MySQL
tags: []
category: info
draft: false
---

Beberapa waktu lalu saya melakukan migrasi server dari sebuah web yang dibangun menggunakan WordPress. Selain migrasi server, web WordPress tersebut akan menggunakan nama domain baru, sehingga web WordPress yang berada di server sebelumnya tetap online. Intinya saya hanya menduplikat data web agar running di server baru dan agar bisa melakukan re-design besar-besaran pada web tersebut.

Ya, memang, ini cara staging yang mempersulit diri sendiri. HAHAHA. Tapi saya suka tantangannya, apalagi ketika saya selesai menduplikat web ke server baru, dan baru teringat kalau URL di database WordPress tersebut harus diganti. Karena kalau tidak, ya tidak akan bisa diakses webnya.

Karena saya running staging ini di virtual private server, tanpa menggunakan kontrol panel, dan tanpa menggunakan phpMyAdmin, maka saya harus mengotak-ngatik database-nya menggunakan command-line interface. Nah, agar saya tidak lupa dengan command-nya jika suatu saat saya melakukan hal ini lagi, maka saya tulislah artikel ini.

Jadi sebenarnya artikel ini untuk diri saya sendiri, walau bisa juga untuk kalian kalau memang nyasar dari Google ke blog pribadi ini. Silakan simak cara mengganti URL WordPress di database MySQL berikut ini.

Pertama-tama, akses server dengan [menggunakan SSH](/blog/cara-menggunakan-ssh/). Lalu, login ke MySQL. Setelah itu, ketik perintah berikut.

```
USE namadatabase;
```

Kemudian cek value pada `siteurl` dan `home` dengan menggunakan perintah berikut.

```
SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl', 'home');
```

Oh iya, pada perintah di atas, jangan lupa ganti bagian `wp_` pada `wp_options` dengan table prefix dari database WordPress kalian. Kalau gak tau atau lupa, table prefix bisa dilihat di dalam file **wp-config.php**, cari aja kode `$table_prefix`.

Output dari perintah di atas kurang lebih akan seperti di bawah ini.

```
+-------------+----------------------------+
| option_name | option_value               |
+-------------+----------------------------+
| home        | https://domainlama.com     |
| siteurl     | https://domainlama.com     |
+-------------+----------------------------+
2 rows in set (0.00 sec)
```

Sekarang saatnya kita update URL lama tersebut menjadi URL dengan nama domain yang baru. Lakukan dengan menggunakan perintah berikut ini.

```
UPDATE wp_options SET option_value = replace(option_value, 'https://domainlama.com', 'https://domainbaru.com') WHERE option_name = 'home' OR option_name = 'siteurl';
```

Dengan itu, URL pada WordPress tersebut akan terganti menjadi URL dengan nama domain baru. Untuk lebih meyakinkan, silakan cek kembali value pada `siteurl` dan `home` menggunakan perintah `SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl', 'home');`

Hasilnya akan menjadi seperti di bawah ini kurang lebihnya.

```
+-------------+----------------------------+
| option_name | option_value               |
+-------------+----------------------------+
| home        | https://domainbaru.com     |
| siteurl     | https://domainbaru.com     |
+-------------+----------------------------+
2 rows in set (0.00 sec)
```

Namun, masih belum selesai. Ada beberapa value lagi yang harus diubah agar web WordPress tersebut berjalan sebagaimana mestinya.

Update value `guid` pada tabel `wp_posts` menggunakan perintah berikut.

```
UPDATE wp_posts SET guid = replace(guid, 'https://domainlama.com','https://domainbaru.com');
```

Update value `post_content` pada tabel `wp_posts` dengan menggunakan perintah berikut.

```
UPDATE wp_posts SET post_content = replace(post_content, 'https://domainlama.com', 'https://domainbaru.com');
```

Update value `meta_value` pada tabel `wp_postmeta` dengan menggunakan perintah berikut.

```
UPDATE wp_postmeta SET meta_value = replace(meta_value, 'https://domainlama.com', 'https://domainbaru.com');
```

Selesai. Sekarang seluruh URL pada web WordPress tersebut telah terganti menjadi URL dengan nama domain baru dan sudah bisa diakses kembali.

Sederhana aja sebenarnya cara menggati URL WordPress di database MySQL. Hanya butuh beberapa command aja. Kendalanya bagi saya cuma terkadang masih kesulitan menghafal command, ya memang kasus ini jarang terjadi, sih. Baru kali ini aja saya menangani case seperti ini. Tapi siapa tau aja kan nanti mengalami lagi, jadi ditulis aja artikelnya supaya tidak lupa.

Okay? Sekarang waktunya ketik perintah berikut.

```
sudo shutdown -h now
```

Bye!
