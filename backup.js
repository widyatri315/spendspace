const firestoreService = require('node-firestore-import-export');
const fs = require('fs');

// Ganti dengan nama file json Anda yang benar
const serviceAccount = require('./firebase.json');

firestoreService.initializeApp(serviceAccount, "https://spenspace.firebaseio.com");


firestoreService.backup('users') // Ganti 'users' dengan nama koleksi Anda, atau hapus untuk semua
    .then(data => {
        fs.writeFileSync('backup.json', JSON.stringify(data));
        console.log('Backup Berhasil!');
    })
    .catch(err => console.error('Gagal:', err));