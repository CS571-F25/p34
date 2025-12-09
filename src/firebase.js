import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyANv5wml0XKCs_5qUGVFXqBveqzWJMS5sg',
  authDomain: 'blt-fantasy-football.firebaseapp.com',
  projectId: 'blt-fantasy-football',
  storageBucket: 'blt-fantasy-football.firebasestorage.app',
  messagingSenderId: '776673477224',
  appId: '1:776673477224:web:eed224688d8bcf7731b1dd',
  measurementId: 'G-4MQFXW4SJ8'
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
