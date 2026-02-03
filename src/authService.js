import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

// Admin email
const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

// Check if user is admin
export const isAdmin = (email) => {
  return email === ADMIN_EMAIL;
};

// Register new user (NO email verification)
export const registerUser = async (email, password, displayName) => {
  try {
    console.log('🔄 Starting registration...');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User created:', user.uid);

    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName });
      console.log('✅ Display name updated');
    }

    console.log('✅ Registration successful - user can login immediately');

    return { 
      success: true, 
      message: '✅ Account created successfully!'
    };
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let errorMessage = 'Registration failed';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already registered';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Login user (NO email verification check)
export const loginUser = async (email, password) => {
  try {
    console.log('🔄 Attempting login for:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Login successful');
    
    return { 
      success: true, 
      user: {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid
      }
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    let errorMessage = 'Login failed';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Try again later';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Reset password (ONLY password reset feature remains)
export const resetPassword = async (email) => {
  try {
    const actionCodeSettings = {
      url: 'https://faizupyzone-bf03f.firebaseapp.com/__/auth/action',
      handleCodeInApp: false
    };
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    return { 
      success: true, 
      message: '✅ Password reset email sent! Check your inbox.' 
    };
  } catch (error) {
    console.error('Reset password error:', error);
    let errorMessage = 'Failed to send reset email';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { success: false, error: errorMessage };
  }
};