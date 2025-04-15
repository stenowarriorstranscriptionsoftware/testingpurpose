// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBjY-pE5jxQJgKqDZrcE7Im66_5r-X_mRA",
  authDomain: "setup-login-page.firebaseapp.com",
  projectId: "setup-login-page",
  storageBucket: "setup-login-page.appspot.com",
  messagingSenderId: "341251531099",
  appId: "1:341251531099:web:f4263621455541ffdc3a7e",
  measurementId: "G-ZXFC7NR9HV"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Initialize jsPDF
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const originalTextEl = document.getElementById('originalText');
  const userTextEl = document.getElementById('userText');
  const compareBtn = document.getElementById('compareBtn');
  const showFullTextBtn = document.getElementById('showFullTextBtn');
  const backToResultsBtn = document.getElementById('backToResultsBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  const resultsSection = document.getElementById('results');
  const fullTextSection = document.getElementById('fullTextSection');
  const comparisonResultEl = document.getElementById('comparisonResult');
  const statsEl = document.getElementById('stats');
  const feedbackEl = document.getElementById('feedback');
  const originalDisplayEl = document.getElementById('originalDisplay');
  const userDisplayEl = document.getElementById('userDisplay');
  const resultDateEl = document.getElementById('resultDate');
  const originalTextGroup = document.getElementById('originalTextGroup');
  const timerOptions = document.getElementById('timerOptions');
  const timerDisplay = document.getElementById('timerDisplay');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const loginPrompt = document.getElementById('loginPrompt');
  const customTestSection = document.getElementById('customTestSection');
  const globalTestsSection = document.getElementById('globalTestsSection');
  const globalTestsList = document.getElementById('globalTestsList');

  // Custom Test Logic
  const saveBtn = document.getElementById('saveTestBtn');
  const clearBtn = document.getElementById('clearTestsBtn');
  const customTitle = document.getElementById('customTitle');
  const customOriginal = document.getElementById('customOriginal');

  // Auth state listener
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      loginBtn.classList.add('hidden');
      userInfo.classList.remove('hidden');
      userPhoto.src = user.photoURL;
      userName.textContent = user.displayName;
      loginPrompt.classList.add('hidden');
      customTestSection.classList.remove('hidden');
      globalTestsSection.classList.remove('hidden');
      loadGlobalTests();
    } else {
      // User is signed out
      loginBtn.classList.remove('hidden');
      userInfo.classList.add('hidden');
      loginPrompt.classList.remove('hidden');
      customTestSection.classList.add('hidden');
      globalTestsSection.classList.add('hidden');
    }
  });

  // Login handler
  loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .catch(error => {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      });
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  // Load global tests from Firebase
  function loadGlobalTests() {
    database.ref('tests').once('value')
      .then(snapshot => {
        globalTestsList.innerHTML = '';
        const tests = snapshot.val();
        
        if (!tests) {
          globalTestsList.innerHTML = '<p>No community tests yet. Be the first to share one!</p>';
          return;
        }
        
        Object.entries(tests).forEach(([id, test]) => {
          const testCard = document.createElement('div');
          testCard.className = 'test-card';
          testCard.innerHTML = `
            <h4>${test.title}</h4>
            <p>${test.text.substring(0, 100)}${test.text.length > 100 ? '...' : ''}</p>
            <div class="test-author">
              <img src="${test.userPhoto}" alt="${test.userName}">
              <span>Added by ${test.userName}</span>
            </div>
          `;
          testCard.addEventListener('click', () => {
            originalTextEl.value = test.text;
          });
          globalTestsList.appendChild(testCard);
        });
      })
      .catch(error => {
        console.error('Error loading tests:', error);
        globalTestsList.innerHTML = '<p>Error loading community tests. Please try again later.</p>';
      });
  }

  // Save test to Firebase
  saveBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please login to save tests.');
      return;
    }

    const title = customTitle.value.trim();
    const text = customOriginal.value.trim();
    
    if (!title || !text) {
      alert('Please enter both a title and the original text.');
      return;
    }

    const testData = {
      title,
      text,
      userName: user.displayName,
      userPhoto: user.photoURL,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    database.ref('tests').push(testData)
      .then(() => {
        alert('Test saved and shared with the community!');
        customTitle.value = '';
        customOriginal.value = '';
        loadGlobalTests();
      })
      .catch(error => {
        console.error('Error saving test:', error);
        alert('Failed to save test. Please try again.');
      });
  });

  // Clear user's tests
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all your shared tests?')) {
      const user = auth.currentUser;
      if (!user) return;

      database.ref('tests').once('value')
        .then(snapshot => {
          const updates = {};
          snapshot.forEach(child => {
            if (child.val().userName === user.displayName) {
              updates[child.key] = null;
            }
          });
          return database.ref('tests').update(updates);
        })
        .then(() => {
          alert('Your shared tests have been removed.');
          loadGlobalTests();
        })
        .catch(error => {
          console.error('Error clearing tests:', error);
          alert('Failed to clear tests. Please try again.');
        });
    }
  });

  // Rest of your existing code (timer functions, comparison logic, etc.)
  // ... [Keep all your existing functions like startTimer, compareTexts, etc.]

  // Initialize the app
  loadGlobalTests();
});