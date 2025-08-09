// Using direct imports from firebase modules
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  // 👇 Alias para evitar colisión de nombres
  getRedirectResult as fbGetRedirectResult,
  updateProfile
} from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

// ⚠️ Sugerido: mover a variables de entorno Vite (VITE_*)
const firebaseConfig = {
  apiKey: "AIzaSyC9aaitfh7epA3Pw27KZ1aQ9Z7pXAbAkcM",
  authDomain: "dojogamingaccess.firebaseapp.com",
  projectId: "dojogamingaccess",
  // ✅ bucket típico de Firebase Storage
  storageBucket: "dojogamingaccess.appspot.com",
  messagingSenderId: "218774598827",
  appId: "1:218774598827:web:eb6be679716c27ca3833ee",
  measurementId: "G-DFT2BLX5FF"
}

const app = initializeApp(firebaseConfig)

// Analytics solo si el entorno lo soporta (evita errores en dev/SSR)
isSupported().then((ok) => { if (ok) getAnalytics(app) }).catch(() => {})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Detect if the device is mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// ✅ Helper seguro para obtener el resultado del redirect
// (exportamos con el MISMO nombre que se usa en AuthContext/App)
export const getRedirectResult = async () => {
  try {
    const result = await fbGetRedirectResult(auth)
    return result?.user ?? null
  } catch (error) {
    console.error('Error getting redirect result:', error)
    throw error
  }
}

// (opcional) alias más expresivo si en otro lado importás "checkRedirectResult"
export const checkRedirectResult = getRedirectResult

export const googleLogin = async () => {
  const provider = new GoogleAuthProvider()
  provider.addScope('profile')
  provider.addScope('email')

  try {
    if (isMobile() || (typeof window !== 'undefined' && window.innerWidth <= 768)) {
      // En mobile, redirect suele ser más fiable
      await signInWithRedirect(auth, provider)
      return { redirecting: true }
    }

    // Desktop: usar popup
    const result = await signInWithPopup(auth, provider)
    return { user: result.user }
  } catch (error) {
    console.error('Error during Google login:', error)
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Este dominio no está autorizado. Contactá al administrador.')
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Cerraste la ventana de login. Probá de nuevo.')
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Error de conexión. Verificá tu internet.')
    }
    throw error
  }
}

// Email/Password Authentication
export const loginWithEmail = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email, password, displayName) => {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Update user profile with display name
      return updateProfile(userCredential.user, {
        displayName: displayName
      }).then(() => userCredential.user);
    });
};

// Create default admin user (only if not exists)
const createDefaultAdmin = async () => {
  const adminEmail = 'admin@dojogaming.com';
  const adminPassword = 'admin123';
  
  try {
    // Try to sign in first
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('Admin user signed in:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // If user doesn't exist, create it
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        await updateProfile(userCredential.user, {
          displayName: 'Admin User',
          role: 'admin'
        });
        console.log('Default admin user created');
        return userCredential.user;
      } catch (createError) {
        console.error('Error creating admin user:', createError);
        throw createError;
      }
    }
    console.error('Error signing in admin:', error);
    throw error;
  }
};

// Initialize default admin on app start
if (typeof window !== 'undefined') {
  createDefaultAdmin().catch(console.error);
}

export const logout = () => signOut(auth);
export const listenAuth = (cb) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Merge Firestore data with auth user
        cb({ ...user, ...userData });
        return;
      }
    }
    cb(user);
  });
};
