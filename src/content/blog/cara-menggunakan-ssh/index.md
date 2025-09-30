---
title: Remote Virtual Server Menggunakan SSH
description: >-
  Tutorial cara menggunakan SSH untuk mengakses VPS dari jarak jauh (remote) menggunakan Terminal Linux dan PuTTy di Windows.
excerpt: >-
  Tutorial cara menggunakan SSH untuk mengakses VPS dari jarak jauh (remote) menggunakan Terminal Linux dan PuTTy di Windows.
publishDate: 2021-09-01T00:00:00.000Z
hero: ./hero.png
heroAlt: Remote Virtual Server Menggunakan SSH
tags: []
category: info
draft: false
---

Secure Shell (SSH) adalah sebuah protokol jaringan kriptografi untuk komunikasi data yang aman, login antarmuka baris perintah, perintah eksekusi jarak jauh, dan layanan jaringan lainnya antara dua jaringan komputer.

Sederhananya, SSH merupakan software yang dapat digunakan untuk mengakses server dari jarak jauh (remote) dengan melalui saluran koneksi terenkripsi. Kalian bisa memonitor server, mengelola direktori server, merestart server, melakukan instalasi software di server, dll. Semua itu bisa dilakukan dari jarak jauh dengan menggunakan SSH.

Betapa bergunanya SSH dapat dibayangkan jika kalian memiliki server di luar negeri, misalnya di datacenter Singapore. Tidak mungkinkan kalian harus jauh-jauh pergi ke Singapore hanya untuk me-restart server? Dengan SSH, kalian bisa mengakses server di Singapore tersebut seperti sedang berada di depan monitor server sungguhan. Sangat amat berguna, kan?

## Cara Mengakses SSH

Terdapat beberapa cara untuk mengakses server secara jarak jauh melalui SSH, di antaranya dengan menggunakan Terminal Linux dan software PuTTy di Windows.

### Melalui Terminal Linux

Sistem operasi Linux sangat developer friendly, banyak fitur-fitur yang dapat memudahkan pekerjaan, salah satunya adalah terminal. Untuk mengakes SSH di Linux sangatlah mudah, cukup buka terminal lalu jalankan perintah seperti di bawah ini.

```bash
ssh erland@12.345.67.890
```

Nama `erland` pada perintah di atas merupakan username, dan `12.345.67.890` merupakan IP dari VPS. Sesuaikan dengan username dan IP server milik kalian, ya.

Default-nya port SSH adalah port 22, kalau kalian belum pernah mengubah port SSH, cukup dengan menggunakan perintah di atas. Sedangkan untuk kalian telah mengubah port SSH, gunakan perintah di bawah ini.

```bash
ssh erland@12.345.67.890 -p 1312
```

`1312` merupakan contoh port SSH, sesuaikan dengan port SSH kalian, ya.

Dengan mengetik perintah login SSH di atas, akan muncul permintaan untuk memasukan password yang merupakan password dari username yang diketik pada perintah tersebut. Saat mengetik password, karakternya tidak akan tampil karena bersifat hidden demi keamanan. Lanjutkan aja ketik password lalu tekan enter.

Jika informasi username, password, dan IP server yang dicantumkan benar, maka kalian akan berhasil login ke server dan bisa memulai untuk remote server melalui SSH di Terminal Linux.

Oh iya, untuk pengguna MacOS juga ada kemudahan untuk menggunakan SSH dengan fitur terminal bawaannya. Cara mengaksesnya sama seperti di Linux yang sudah dijelaskan di atas, ya.

### Melalui Software PuTTy

Berbeda dengan Linux dan MacOS, sistem operasi Windows tidak terdapat terminal bawaan untuk langsung mengakses SSH. Namun, jangan khawatir, kalian pengguna Windows tetap bisa mengakses server secara remote melalui SSH di Windows dengan menggunakan software bernama PuTTy. PuTTy merupakan salah satu software yang dapat digunakan untuk membuat koneksi SSH antara client dan server.

Download terlebih dahulu PuTTy melalui website resminya <a href="https://www.putty.org" rel="nofollow" target="_blank">https://www.putty.org</a>.

Setelah download, lanjutkan dengan menginstalnya di Windows dengan cara yang sama sebagaimana kalian biasa menginstal sebuah software di Windows.

Setelah instalasi selesai, buka PuTTy, dan lakukan konfigurasi seperti petunjuk gambar di bawah ini.

![](./images/akses-ssh-putty.jpg 'Mengakses SSH di PuTTy')

Berikut penjelasan konfigurasi mengakses SSH melalui PuTTy.

1. Pada bidang hostname (or IP address), masukan IP address VPS kalian.
2. Pada connection type, pilih opsi SSH.
3. Pada bidang port, masukan port SSH kalian. Kalau belum pernah mengubah port SSH, biarkan saja kosong.
4. Klik Open.

Setelah itu biasanya akan terdapat notifikasi peringatan yang hanya muncul saat pertama kali kita mengakses SSH pada sebuah server. Klik saja tombol **Accept**.

Kemudian akan diminta untuk memasukan username dan password seperti gambar di bawah ini, isi dengan user dan password kalian, ya.

![](./images/login-ssh-putty.jpg 'Login SSH di PuTTy')

Jika informasi username, password, dan IP server yang dicantumkan benar, maka kalian akan berhasil login ke server dan bisa memulai untuk remote server melalui SSH di Windows dengan menggunakan PuTTy.

![](./images/menggunakan-ssh-putty.jpg 'Berhasil login SSH di PuTTy')

Jika ini pertama kalinya kalian menggunakan SSH untuk mengakses VPS secara remote, mulailah belajar Linux agar terampil dalam mengoperasikan terminal dengan command line. Yuk gunakan Linux!
