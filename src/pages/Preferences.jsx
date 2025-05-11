import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import bookLogo from '../assets/book.svg';
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';
import { db } from '../../config/firebase';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

function Preferences() {
  const navigate = useNavigate();
  const [selectedGenres, setSelectedGenres] = useState([]); // Initializes as an empty array
  const [selectedAges, setSelectedAges] = useState([]); // Initializes as an empty array  

  const genres = ['Romance', 'Fantasy', 'Science Fiction', 'Historical Fiction', 'Literary Fiction', 'Erotic', 'Crime', 'Adventure', 'Comedy', 'Poetry', 'Drama', 'Philosophical', 'Graphic'];
  const ageGroups = [ 'Picture', 'Easy Readers', 'Middle-Grade', 'Young Adult', 'Adult'];

  const toggleSelection = (item, list, setList) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };
  
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
  
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const data = userSnap.data();
          const prefs = data.preferences || {};
  
          setSelectedGenres(prefs.genres || []);
          setSelectedAges(prefs.ageGroups || []);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
  
    fetchPreferences();
  }, [user]);  

  // Save preferences
  const handleSubmit = async (event) => {
    event.preventDefault();  // Prevent page refresh

    if (!user) {
      console.log("User is not authenticated");
      return;
    }
  
    try {
      const userRef = doc(db, 'users', user.uid);
  
      // Update user preferences in Firestore
      await setDoc(userRef, {
        preferences: {
          genres: selectedGenres,
          ageGroups: selectedAges,
        },
      }, { merge: true });
  
      // Navigate to dashboard after saving preferences
      navigate('/dashboard');
      console.log("Navigating to dashboard.");
    } catch (error) {
      console.error('Error saving preferences:', error);
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

      <main id="preferences">
        <h1>Preferences</h1>
        <p>Be adventurous.</p>
        <br></br>

        <section id="genres">
          <h4>Genre</h4>
          <div className="button-group">
            {genres.map(genre => (
              <Button color="dark" pill
                key={genre}
                outline={!selectedGenres.includes(genre)}
                onClick={() => toggleSelection(genre, selectedGenres, setSelectedGenres)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </section>

        <section id="ages" className="mt-4">
          <h4>Age Group</h4>
          <div className="button-group">
            {ageGroups.map(age => (
              <Button color="dark" pill
                key={age}
                outline={!selectedAges.includes(age)}
                onClick={() => toggleSelection(age, selectedAges, setSelectedAges)}
              >
                {age}
              </Button>
            ))}
          </div>
        </section>

        <div className="mt-6">
          <Button onClick={handleSubmit} className="bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:bg-gradient-to-bl focus:ring-blue-300 dark:focus:ring-blue-800">
            Show me books!
          </Button>
        </div>
      </main>
    </div>
  );
}

export default Preferences;
