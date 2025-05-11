import { useState } from 'react';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../provider/authProvider";
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [user, setUser] = useState();

  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/Signup');
  };

  const handleSignIn = async (e) => {
  e.preventDefault();
  try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the user
      const user = userCredential.user;
      setUser(user); // or context.setUser(user)

      // Get the ID token from the authenticated user
      const idToken = await user.getIdToken();
      setToken(idToken);
      
      navigate("/dashboard", { replace: true });
  } catch (error) {
      console.error(error);
  }
  };


  return (
    <div>
      <h2>Sign In</h2>
      <br></br>
      <form onSubmit={handleSignIn}>
        <div>
          <input
            type="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <br></br>

        <div>
          <input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <br></br>

        <Button color="dark" onClick= { handleSignUp }> Sign up instead. </Button>
        <br></br>
        <Button color="dark" type="submit">Sign In!</Button>
      </form>
    </div>
  );
};

export default SignIn;