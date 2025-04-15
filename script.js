// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyBjY-pE5jxQJgKqDZrcE7Im66_5r-X_mRA",
  authDomain: "setup-login-page.firebaseapp.com",
  projectId: "setup-login-page",
  storageBucket: "setup-login-page.firebasestorage.app",
  messagingSenderId: "341251531099",
  appId: "1:341251531099:web:f4263621455541ffdc3a7e",
  measurementId: "G-ZXFC7NR9HV"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");

let currentUser = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userInfo.classList.remove("hidden");
    userInfo.textContent = `Logged in as: ${user.displayName}`;
    loadTestDropdown();
  } else {
    currentUser = null;
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userInfo.classList.add("hidden");
    testSelect.innerHTML = `<option value="">-- Select Saved Test --</option>`;
  }
});

loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Login failed: " + err.message));
});

logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Save, Load, Delete test from Firestore
const saveBtn = document.getElementById('saveTestBtn');
const loadBtn = document.getElementById('loadTestBtn');
const deleteBtn = document.getElementById('deleteTestBtn');
const testSelect = document.getElementById('testSelect');
const customTitle = document.getElementById('customTitle');
const customOriginal = document.getElementById('customOriginal');

saveBtn.addEventListener('click', () => {
  if (!currentUser) return alert("Please login to save a test.");

  const title = customTitle.value.trim();
  const text = customOriginal.value.trim();
  if (!title || !text) {
    alert("Please enter both title and text.");
    return;
  }

  db.collection("tests").doc(title).set({
    text,
    title,
    addedBy: currentUser.displayName,
    addedByEmail: currentUser.email,
    uid: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Test saved!");
    customTitle.value = "";
    customOriginal.value = "";
    loadTestDropdown();
  }).catch(err => alert("Error saving test: " + err.message));
});

loadBtn.addEventListener("click", () => {
  const selected = testSelect.value;
  if (!selected) return alert("Select a test.");
  db.collection("tests").doc(selected).get().then(doc => {
    if (doc.exists) {
      document.getElementById('originalText').value = doc.data().text;
      document.getElementById('originalTextGroup').classList.remove('hidden');
      alert(`Loaded: ${doc.id}`);
    }
  });
});

deleteBtn.addEventListener("click", () => {
  const selected = testSelect.value;
  if (!selected) return alert("Select a test.");
  db.collection("tests").doc(selected).get().then(doc => {
    if (doc.exists) {
      const testData = doc.data();
      if (currentUser && testData.uid === currentUser.uid) {
        if (confirm(`Delete test: "${selected}"?`)) {
          db.collection("tests").doc(selected).delete().then(() => {
            alert("Deleted!");
            loadTestDropdown();
          });
        }
      } else {
        alert("You can only delete tests you created.");
      }
    }
  });
});

function loadTestDropdown() {
  testSelect.innerHTML = `<option value="">-- Select Saved Test --</option>`;
  db.collection("tests").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${doc.id} (by ${data.addedBy || "Unknown"})`;
      testSelect.appendChild(option);
    });
  });
}

// Initialize jsPDF
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', function () {
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

  let timerInterval;
  let endTime;
  let testActive = false;
  let timerButtons = document.querySelectorAll('.timer-option');
  let startTime = null;

  userTextEl.addEventListener('input', function () {
    if (!startTime) {
      startTime = new Date();
    }
  });

  originalTextEl.addEventListener('paste', function () {
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

  timerButtons.forEach(button => {
    button.addEventListener('click', function () {
      const minutes = parseInt(this.dataset.minutes);
      startTimer(minutes);
      timerOptions.classList.add('hidden');
      timerDisplay.classList.remove('hidden');
      testActive = true;
    });
  });

  compareBtn.addEventListener('click', function () {
    stopTimer();
    compareTexts();
    disableTimerOptions();
  });

  showFullTextBtn.addEventListener('click', showFullTexts);
  backToResultsBtn.addEventListener('click', showResults);
  downloadPdfBtn.addEventListener('click', downloadAsPdf);
  closeResultsBtn.addEventListener('click', () => location.reload());

  function startTimer(minutes) {
    endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + minutes);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      updateTimerDisplay();
      const now = new Date();
      if (now >= endTime) {
        stopTimer();
        timerDisplay.classList.add('timer-ended');
        timerDisplay.textContent = "TIME'S UP!";
        compareTexts();
        lockTest();
        disableTimerOptions();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerDisplay.classList.add('hidden');
  }

  function disableTimerOptions() {
    timerButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }

  function updateTimerDisplay() {
    const now = new Date();
    const remaining = endTime - now;
    if (remaining <= 0) return;
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function lockTest() {
    userTextEl.readOnly = true;
    userTextEl.classList.add('locked-textarea');
    compareBtn.disabled = true;
    closeResultsBtn.classList.remove('hidden');
  }

  function showFullTexts() {
    resultsSection.classList.add('hidden');
    fullTextSection.classList.remove('hidden');
  }

  function showResults() {
    fullTextSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
  }

  function downloadAsPdf() {
    const resultsElement = document.getElementById('results');
    html2canvas(resultsElement, { scale: 1.5, useCORS: true, allowTaint: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('transcription-comparison.pdf');
    });
  }

  // (Compare logic, stats, feedback, and analysis functions follow here)
});
function processText(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()
    .split(/\s+/);
}

function isSimilar(wordA, wordB) {
  const minLength = Math.min(wordA.length, wordB.length);
  const maxLength = Math.max(wordA.length, wordB.length);
  let similarCount = 0;
  for (let i = 0; i < minLength; i++) {
    if (wordA[i] === wordB[i]) similarCount++;
  }
  return (similarCount / maxLength) * 100 >= 50;
}

function compareParagraphs(originalWords, userWords) {
  let html = '';
  let numHalfDiff = 0;
  let numFullDiff = 0;
  let i = 0, j = 0;

  while (i < originalWords.length || j < userWords.length) {
    const ow = originalWords[i] || '';
    const uw = userWords[j] || '';
    const cleanOW = ow.toLowerCase().replace(/[^\w]/g, '');
    const cleanUW = uw.toLowerCase().replace(/[^\w]/g, '');

    if (cleanOW === cleanUW) {
      html += `<span class="correct">${uw}</span> `;
      i++; j++;
    } else if (cleanOW !== cleanUW && isSimilar(cleanOW, cleanUW)) {
      html += `<span class="spelling">${uw}</span> `;
      numHalfDiff++; i++; j++;
    } else if (!ow) {
      html += `<span class="addition">${uw}</span> `;
      j++; numFullDiff++;
    } else if (!uw) {
      html += `<span class="missing">${ow}</span> `;
      i++; numFullDiff++;
    } else {
      html += `<span class="missing">${ow}</span> <span class="addition">${uw}</span> `;
      i++; j++; numFullDiff++;
    }
  }

  const keystrokes = userTextEl.value.length;
  const errorRate = ((numHalfDiff / 2 + numFullDiff) / originalWords.length) * 100;
  const accuracy = Math.max(0, 100 - errorRate);
  const wpm = startTime
    ? Math.round(userWords.length / ((new Date() - startTime) / 60000))
    : 0;

  return {
    html,
    stats: {
      totalOriginal: originalWords.length,
      totalUser: userWords.length,
      halfMistakes: numHalfDiff,
      fullMistakes: numFullDiff,
      keystrokes,
      wpm,
      accuracy: accuracy.toFixed(1),
      errorRate: errorRate.toFixed(1),
    }
  };
}

function displayComparison(comparison) {
  comparisonResultEl.innerHTML = comparison.html;
}

function displayStats(stats) {
  statsEl.innerHTML = `
    <div class="stat-item"><h4>Original Words</h4><p>${stats.totalOriginal}</p></div>
    <div class="stat-item"><h4>Your Words</h4><p>${stats.totalUser}</p></div>
    <div class="stat-item"><h4>Half Mistakes</h4><p>${stats.halfMistakes}</p></div>
    <div class="stat-item"><h4>Full Mistakes</h4><p>${stats.fullMistakes}</p></div>
    <div class="stat-item"><h4>Keystrokes</h4><p>${stats.keystrokes}</p></div>
    <div class="stat-item"><h4>WPM</h4><p>${stats.wpm}</p></div>
    <div class="stat-item"><h4>Accuracy</h4><p>${stats.accuracy}%</p></div>
  `;
}

function displayFullTexts(original, user) {
  originalDisplayEl.textContent = original;
  userDisplayEl.textContent = user;
}

function displayFeedback(stats, originalWords, userWords) {
  const feedback = [];
  if (stats.accuracy >= 95) {
    feedback.push("🌟 Excellent accuracy! You're nearly perfect.");
  } else if (stats.accuracy >= 85) {
    feedback.push("👍 Good work! A bit more precision will make it excellent.");
  } else {
    feedback.push("⚠️ Needs improvement. Focus on accuracy first.");
  }

  if (stats.wpm >= 50) {
    feedback.push("⚡ Great speed! Keep it up.");
  } else if (stats.wpm >= 40) {
    feedback.push("🏃 Solid pace. Push a little more for top speed.");
  } else {
    feedback.push("🐢 Speed is low. Practice typing faster with fewer errors.");
  }

  const list = feedback.map(f => `<li>${f}</li>`).join('');
  feedbackEl.innerHTML = `<h4>Feedback</h4><ul>${list}</ul>`;
}