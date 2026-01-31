import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

// Register New User
export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, {
      displayName: name
    });
    
    console.log('✅ User registered:', user.email);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    // User-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already registered. Please login instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Login User
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User logged in:', user.email);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    // User-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Try again later.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Logout User
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ User logged out');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    return { success: false, error: error.message };
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Check if user is admin
export const isAdmin = (email) => {
  const adminEmails = [
    'admin@faiz.com', 
    'luckyfaizu3@gmail.com'
  ];
  return adminEmails.includes(email?.toLowerCase());
};