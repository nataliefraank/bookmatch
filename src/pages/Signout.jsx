import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../provider/authProvider';
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';

const Signout = () => {

  const navigate = useNavigate();
  const { setToken } = useAuth();

  const handleHome = () => {
      navigate('/');
    };

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      setToken(null); // Clear the token from React Context
      alert('User signed out successfully');
      navigate('/signin'); // Go to signin page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div>
      <h1>Sign Out Page</h1>
      <Button color="dark" onClick={handleSignOut}>Sign Out</Button>
      <br></br>
      <Button color="dark" onClick={handleHome}>HOME</Button>
    </div>
  );
};

export default Signout;


// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../provider/authProvider";

// const Logout = () => {
//   const { setToken } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     setToken();
//     navigate("/", { replace: true });
//   };

//   setTimeout(() => {
//     handleLogout();
//   }, 3 * 1000);

//   return <>Logout Page</>;
// };

// export default Logout;