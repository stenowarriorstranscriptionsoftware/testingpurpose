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
  const leaderboardSection = document.getElementById('leaderboardSection');
  const leaderboardList = document.getElementById('leaderboardList');
  const leaderboardFilter = document.getElementById('leaderboardFilter');
  const testNameFilter = document.getElementById('testNameFilter');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const leaderboardPagination = document.getElementById('leaderboardPagination');
  const saveBtn = document.getElementById('saveTestBtn');
  const clearBtn = document.getElementById('clearTestsBtn');
  const customTitle = document.getElementById('customTitle');
  const customOriginal = document.getElementById('customOriginal');

  // New authentication elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const emailLoginBtn = document.getElementById('emailLoginBtn');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const registerName = document.getElementById('registerName');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const confirmPassword = document.getElementById('confirmPassword');

  // Timer variables
  let timerInterval;
  let endTime;
  let testActive = false;
  let timerButtons = document.querySelectorAll('.timer-option');
  
  // Leaderboard pagination variables
  let currentPage = 1;
  const entriesPerPage = 10;
  let allAttempts = [];
  let filteredAttempts = [];
  let uniqueTestNames = new Set();

  // Initialize typing timer
  let startTime = null;
  userTextEl.addEventListener('input', function() {
    if (!startTime) {
      startTime = new Date();
    }
  });

  // Toggle between login and register forms
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Email/password login handler
  emailLoginBtn.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        // Success - auth state listener will handle the UI update
      })
      .catch(error => {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
      });
  });

  // Registration handler
  registerBtn.addEventListener('click', () => {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirm = confirmPassword.value.trim();
    
    if (!name || !email || !password || !confirm) {
      alert('Please fill in all fields');
      return;
    }
    
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      alert('Password should be at least 6 characters');
      return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Update user profile with display name
        return userCredential.user.updateProfile({
          displayName: name
        });
      })
      .then(() => {
        alert('Registration successful! You are now logged in.');
        // Clear form
        registerName.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        confirmPassword.value = '';
        // Switch to login form
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
      })
      .catch(error => {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
      });
  });

  // Google login handler
  googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .catch(error => {
        console.error('Google login error:', error);
        alert('Google login failed. Please try again.');
      });
  });

  // Auth state listener
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      loginBtn.classList.add('hidden');
      userInfo.classList.remove('hidden');
      // Check if user has a photo URL (Google users will, email users won't)
      if (user.photoURL) {
        userPhoto.src = user.photoURL;
      } else {
        // Use a default avatar for email users
        userPhoto.src = 'https://www.gravatar.com/avatar/' + user.uid + '?d=identicon';
      }
      userName.textContent = user.displayName || 'User';
      loginPrompt.classList.add('hidden');
      customTestSection.classList.remove('hidden');
      globalTestsSection.classList.remove('hidden');
      leaderboardSection.classList.remove('hidden');
      loadGlobalTests();
      loadLeaderboard();
      cleanupOldData();
    } else {
      // User is signed out
      loginBtn.classList.remove('hidden');
      userInfo.classList.add('hidden');
      loginPrompt.classList.remove('hidden');
      customTestSection.classList.add('hidden');
      globalTestsSection.classList.add('hidden');
      leaderboardSection.classList.add('hidden');
      // Show login form by default
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  // Rest of your existing code remains the same...
  // [Include all the existing functions like loadLeaderboard, updateTestNameFilter, 
  // updatePagination, renderLeaderboardTable, cleanupOldData, startTimer, stopTimer, 
  // disableTimerOptions, updateTimerDisplay, lockTest, compareTexts, showFullTexts, 
  // showResults, downloadAsPdf, processText, isSimilar, arraysAreEqual, compareParagraphs, 
  // displayComparison, displayStats, displayFeedback, displayFullTexts, analyzeMistakes, 
  // getOverallAssessment, getImprovementSuggestions, loadGlobalTests, and all event listeners]
  // ...

  // Original text paste handler
  originalTextEl.addEventListener('paste', function() {
    // Clear any selected test card
    document.querySelectorAll('.test-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    setTimeout(() => {
      if (originalTextEl.value.trim() !== '' && !testActive) {
        originalTextGroup.classList.add('hidden');
        timerOptions.classList.remove('hidden');
        timerButtons.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
        });
      }
    }, 0);
  });
  
  // Timer option click handler
  timerButtons.forEach(button => {
    button.addEventListener('click', function() {
      const minutes = parseInt(this.dataset.minutes);
      startTimer(minutes);
      timerOptions.classList.add('hidden');
      timerDisplay.classList.remove('hidden');
      testActive = true;
    });
  });
  
  // Compare button click handler
  compareBtn.addEventListener('click', function() {
    stopTimer();
    compareTexts();
    disableTimerOptions();
  });
  
  // Show full text button click handler
  showFullTextBtn.addEventListener('click', showFullTexts);
  
  // Back to results button click handler
  backToResultsBtn.addEventListener('click', showResults);
  
  // Download PDF button click handler
  downloadPdfBtn.addEventListener('click', downloadAsPdf);
  
  // Close results button click handler
  closeResultsBtn.addEventListener('click', function() {
    location.reload();
  });

  // [Include all other existing functions here...]
  // They remain exactly the same as in your original code
  // Just make sure to include them all

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
      userPhoto: user.photoURL || 'https://www.gravatar.com/avatar/' + user.uid + '?d=identicon',
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

  // Clear user's tests with selection option
  clearBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;

    database.ref('tests').orderByChild('userName').equalTo(user.displayName).once('value')
      .then(snapshot => {
        const userTests = snapshot.val();
        if (!userTests || Object.keys(userTests).length === 0) {
          alert('You have no tests to delete.');
          return;
        }

        // Create a modal to show test selection
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h3>Select Tests to Delete</h3>
            <div class="test-selection"></div>
            <div class="modal-buttons">
              <button id="cancelDelete" class="secondary-btn">Cancel</button>
              <button id="confirmDelete" class="danger-btn">Delete Selected</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const testSelection = modal.querySelector('.test-selection');
        const checkboxes = [];
        
        // Add checkboxes for each test
        Object.entries(userTests).forEach(([id, test]) => {
          const testItem = document.createElement('div');
          testItem.className = 'test-item';
          const checkboxId = `test-${id}`;
          testItem.innerHTML = `
            <input type="checkbox" id="${checkboxId}" checked>
            <label for="${checkboxId}">${test.title}</label>
          `;
          testSelection.appendChild(testItem);
          checkboxes.push({id, checkbox: testItem.querySelector('input')});
        });
        
        // Cancel button handler
        modal.querySelector('#cancelDelete').addEventListener('click', () => {
          document.body.removeChild(modal);
        });
        
        // Confirm delete button handler
        modal.querySelector('#confirmDelete').addEventListener('click', () => {
          const selectedTests = checkboxes
            .filter(item => item.checkbox.checked)
            .map(item => item.id);
          
          if (selectedTests.length === 0) {
            alert('Please select at least one test to delete.');
            return;
          }
          
          const updates = {};
          selectedTests.forEach(id => {
            updates[id] = null;
          });
          
          database.ref('tests').update(updates)
            .then(() => {
              alert(`${selectedTests.length} test(s) deleted successfully.`);
              document.body.removeChild(modal);
              loadGlobalTests();
            })
            .catch(error => {
              console.error('Error deleting tests:', error);
              alert('Failed to delete tests. Please try again.');
            });
        });
      })
      .catch(error => {
        console.error('Error fetching user tests:', error);
        alert('Failed to fetch your tests. Please try again.');
      });
  });
});