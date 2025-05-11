import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import bookLogo from '../assets/book.svg';
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';
import { useAuth } from '../provider/authProvider';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

function Welcome() {
  const navigate = useNavigate();
  const { token } = useAuth(); // <-- get token from auth context
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
    
  const [userPreferences, setUserPreferences] = useState({ genres: [], ageGroups: [] });

  // Load user preferences
    useEffect(() => {
      const fetchPreferences = async () => {
    
        if (!user) return;
    
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
    
          if (docSnap.exists()) {
            const prefs = docSnap.data().preferences;
            setUserPreferences({
              genres: prefs?.genres || [],
              ageGroups: prefs?.ageGroups || [],
            });
          }
        } catch (error) {
          console.error('Error fetching preferences:', error);
        }
      };
    
      fetchPreferences();
    }, []);

  const goDashboard = async () => {
    if (token) {
      // Ensure the user is logged in before proceeding
      if (!user) {
        console.log("No user found, please log in.");
        navigate('/signin');
        return;
      }
  
      try {
        // Fetch user data from Firestore
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
    
        if (docSnap.exists()) {
          const data = docSnap.data();
    
          // Check if there are any selected genres or age groups
          if (userPreferences.genres.length === 0 && userPreferences.ageGroups.length === 0) {
            console.log('No genres or age groups selected');
            navigate('/preferences');
            console.log("Signed in. Navigating to preferences.");
            return;
          }
          navigate('/dashboard');
          console.log("Signed in. Navigating to dashboard.");
        } else {
          console.log("No user data found. Redirecting to preferences.");
          navigate('/preferences');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    } else {
      navigate('/signin');
      console.log("Not signed in. Navigating to sign in.");
    }
  };
    
  return (
    <div>
      <header id="hero">
        <a onClick={() => navigate('/')}className="logo-button">
          <img src={bookLogo} className="logo" alt="BookMatch logo" />
        </a>
        <h2>BookMatch</h2>
      </header>

      <main id="content">
        <h1>Welcome!</h1>
        <p>So, you’ve finished your last great read—what’s next?</p>
        <p>
          Forget endless scrolling and outdated recommendations. BookMatch takes book discovery
          to the next level with a swipe-based experience that matches you with books tailored to
          your tastes. Tell us what you love, and we’ll deliver your next favorite read—fast.
        </p>
        <h4>We help match you to your favorite books.</h4>

        <div id="buttons">
          <Button
            className="bg-gradient-to-br from-pink-500 to-orange-400 text-white hover:bg-gradient-to-bl focus:ring-pink-200 dark:focus:ring-pink-800"
            id="start"
            onClick={goDashboard}
          >
            Start swiping
          </Button>
          <Button id="back" color="dark" outline onClick={() => navigate('/about')}>
            Learn more
          </Button>
        </div>
      </main>
    </div>
  );
}

export default Welcome;
