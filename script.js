// Navigation configuration
const navConfig = [
    { 
        id: 'home',
        icon: '🏠',
        text: 'Home',
        url: 'index.html'
    },
    { 
        id: 'search',
        icon: '🔍',
        text: 'Search',
        url: 'search.html'
    },
    { 
        id: 'upload',
        icon: '➕',
        text: 'Upload',
        url: 'upload.html'
    },
    { 
        id: 'favourites',
        icon: '🩷',
        text: 'Favourites',
        url: 'favourites.html'
    },
    { 
        id: 'profile',
        icon: '👤',
        text: 'Profile',
        url: 'profile.html'
    }
];

// makes the floating back button in the top left work
function goBack() {
    // Check if there's history to go back to
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    }
}

// Initialize navigation
function initNavigation() {
    const bottomNav = document.getElementById('bottomNav');
    if (!bottomNav) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    navConfig.forEach(item => {
        const navItem = document.createElement('a');
        navItem.href = item.url;
        navItem.className = 'nav-item';
        navItem.id = `nav-${item.id}`;

        // Add active class if current page matches
        if (currentPage === item.url || 
            (currentPage === 'index.html' && item.id === 'home')) {
            navItem.classList.add('active');
        }

        navItem.innerHTML = `
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-text">${item.text}</span>
        `;

        bottomNav.appendChild(navItem);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    
    // Load recipe if on cooking page
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    if (currentPage.includes('cooking-page')) {
        loadRecipe();
    }
});

// ===== COOKING PAGE RECIPE LOADING =====
// Global variables for step-by-step mode
let currentRecipe = null;
let currentStepIndex = 0;

// Timer state variables
let timerInterval = null;
let timerRemainingSeconds = 0;
let timerIsRunning = false;

function loadRecipe() {
    // Get the "recipe" parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileKey = urlParams.get('recipe');
    
    // If no recipe parameter, show error
    if (!fileKey) {
        showRecipeError('No recipe specified. Please add ?recipe=recipe_name to the URL.');
        return;
    }
    
    // Map file keys to actual file names by adding .json extension
    const fileName = 'recipes/' + fileKey + '.json';
    
    // Load the file
    fetch(fileName)
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            // Parse and store the recipe
            currentRecipe = JSON.parse(data);
            currentStepIndex = 0; // Start at first step
            renderCurrentStep(); // Render the first step
            setupNavigationButtons(); // Wire up Prev/Next buttons
            setupTimerButton(); // Wire up timer button
            setupVoiceNarration(); // Wire up voice narration button
        })
        .catch(error => {
            console.error('Error loading recipe:', error);
            let errorMsg = 'Recipe not found: ' + fileName;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg += '<br><br>Note: If you opened this file directly (file://), you need to use a local web server. Try using a tool like Live Server in VS Code or Python\'s http.server.';
            }
            showRecipeError(errorMsg);
        });
}

function showRecipeError(message) {
    const content = document.getElementById('contentArea');
    if (content) {
        content.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #c10404;">
                <h2>Error</h2>
                <div>${message}</div>
            </div>
        `;
    }
    console.error('Recipe loading error:', message);
}

// Render only the current step
function renderCurrentStep() {
    if (!currentRecipe || !currentRecipe.steps || currentRecipe.steps.length === 0) {
        console.error('No recipe or steps available');
        return;
    }
    
    const content = document.getElementById('contentArea');
    if (!content) return;
    
    const step = currentRecipe.steps[currentStepIndex];
    if (!step) {
        console.error('Step not found at index:', currentStepIndex);
        return;
    }
    
    // Update top bar with recipe title
    const recipeNameEl = document.querySelector('.cooking-recipe-name');
    if (recipeNameEl) {
        recipeNameEl.textContent = currentRecipe.title || 'Untitled Recipe';
    }
    
    // Update step indicator
    const stepIndicatorEl = document.querySelector('.cooking-step-indicator');
    if (stepIndicatorEl) {
        stepIndicatorEl.textContent = `STEP ${currentStepIndex + 1} OF ${currentRecipe.steps.length}`;
    }
    
    // Build HTML for current step
    const stepImage = step.image || 'images/meal_placeholder.png';
    const stepText = step.text || '';
    const stepTime = step.time || '';
    
    // Get tips: prefer step-specific tips, fallback to recipe-level tips
    const tips = (step.tips && Array.isArray(step.tips) && step.tips.length > 0) 
        ? step.tips 
        : (currentRecipe.tips && Array.isArray(currentRecipe.tips) && currentRecipe.tips.length > 0)
            ? currentRecipe.tips
            : [];
    
    // Build tips list HTML
    let tipsListHTML = '';
    if (tips.length > 0) {
        tipsListHTML = `
            <ul class="cooking-tips-list">
                ${tips.map(tip => `
                    <li class="cooking-tips-item">${tip}</li>
                `).join('')}
            </ul>
        `;
    }
    
    // Build current step HTML with new layout
    content.innerHTML = `
        <div class="cooking-media-section">
            <img class="cooking-media" src="${stepImage}" alt="Step ${currentStepIndex + 1}">
        </div>
        
        <div class="cooking-instructions-section">
            <h2 class="cooking-instructions-title">Instructions</h2>
            <div class="cooking-instruction-item current">
                ${stepText}
            </div>
        </div>
        
        <div class="cooking-tips-section">
            <div class="cooking-tips-header">
                <div class="tips-header">
                    <svg class="tips-icon" width="22" height="22" viewBox="0 0 24 24">
                        <path d="M9 21h6v-1H9v1zm3-19a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A6.98 6.98 0 0020 9a7 7 0 00-7-7z"/>
                    </svg>
                    <span class="tips-title">Tips</span>
                </div>
            </div>
            <div class="cooking-tips-content">
                ${tipsListHTML}
                ${stepTime ? `<p class="cooking-tips-duration">Duration: ${stepTime}</p>` : ''}
            </div>
        </div>
    `;
    
    // Reset timer when step changes
    resetTimer();
    
    // Stop any ongoing voice narration when step changes
    stopSpeech();
    updateVoiceNarrationButton(false);
    
    // Update timer button with step time
    const timerBtn = document.querySelector('.cooking-timer-btn');
    if (timerBtn) {
        // Parse step time and initialize timer
        if (stepTime) {
            timerRemainingSeconds = parseTimeString(stepTime);
        } else {
            // Try to read from button text as fallback
            const buttonText = timerBtn.textContent.trim();
            timerRemainingSeconds = parseTimeString(buttonText) || 0;
        }
        
        // Update button text only (keep SVG icon)
        updateTimerButtonText(timerRemainingSeconds);
        
        // Remove any "time's up" styling
        timerBtn.classList.remove('timer-times-up');
        timerBtn.style.background = 'white';
        timerBtn.style.color = '#007AFF'; // Reset to original blue color
        
        // Ensure timer button has click handler
        setupTimerButton();
    }
    
    // Update navigation button states
    updateNavigationButtons();
}

// Setup navigation button event listeners (only once)
function setupNavigationButtons() {
    const prevBtn = document.querySelector('.cooking-nav-btn.prev');
    const nextBtn = document.querySelector('.cooking-nav-btn.next');
    
    // Only attach listeners if not already attached
    if (prevBtn && !prevBtn.hasAttribute('data-nav-listener')) {
        prevBtn.setAttribute('data-nav-listener', 'true');
        prevBtn.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                renderCurrentStep();
            }
        });
    }
    
    if (nextBtn && !nextBtn.hasAttribute('data-nav-listener')) {
        nextBtn.setAttribute('data-nav-listener', 'true');
        nextBtn.addEventListener('click', () => {
            if (currentRecipe && currentStepIndex < currentRecipe.steps.length - 1) {
                currentStepIndex++;
                renderCurrentStep();
            }
        });
    }
    
    // Initial button state update
    updateNavigationButtons();
}

// Update navigation button disabled states
function updateNavigationButtons() {
    const prevBtn = document.querySelector('.cooking-nav-btn.prev');
    const nextBtn = document.querySelector('.cooking-nav-btn.next');
    
    if (!currentRecipe || !currentRecipe.steps) return;
    
    const totalSteps = currentRecipe.steps.length;
    
    // Update Prev button
    if (prevBtn) {
        if (currentStepIndex === 0) {
            prevBtn.disabled = true;
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.disabled = false;
            prevBtn.classList.remove('disabled');
        }
    }
    
    // Update Next button
    if (nextBtn) {
        if (currentStepIndex >= totalSteps - 1) {
            nextBtn.disabled = true;
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.remove('disabled');
        }
    }
}

// ===== TIMER FUNCTIONS =====

// Parse time string like "8 mins", "1 min", or "08:00" into seconds
function parseTimeString(timeStr) {
    if (!timeStr) return 0;
    
    const str = timeStr.trim();
    
    // First try to match "MM:SS" format (e.g., "08:00", "07:45")
    const mmssMatch = str.match(/^(\d{1,2}):(\d{2})$/);
    if (mmssMatch) {
        const mins = parseInt(mmssMatch[1]);
        const secs = parseInt(mmssMatch[2]);
        return mins * 60 + secs;
    }
    
    // Match patterns like "8 mins", "1 min", "5 minutes", etc.
    const lowerStr = str.toLowerCase();
    const match = lowerStr.match(/(\d+)\s*(min|mins|minute|minutes)/);
    if (match) {
        return parseInt(match[1]) * 60;
    }
    
    // Try to match just seconds
    const secMatch = lowerStr.match(/(\d+)\s*(sec|secs|second|seconds)/);
    if (secMatch) {
        return parseInt(secMatch[1]);
    }
    
    return 0;
}

// Format seconds into "MM:SS" string
function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update only the text part of timer button (keep SVG icon on the left)
function updateTimerButtonText(seconds) {
    const timerBtn = document.querySelector('.cooking-timer-btn');
    if (!timerBtn) return;
    
    // Find the SVG icon (should be first child)
    const svgIcon = timerBtn.querySelector('.cooking-timer-icon');
    if (!svgIcon) return;
    
    // Find all text nodes and remove them
    const childNodes = Array.from(timerBtn.childNodes);
    childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            timerBtn.removeChild(node);
        }
    });
    
    // Determine what text to show
    const displayText = seconds === 0 && !timerIsRunning ? ' TIME\'S UP' : ' ' + formatTime(seconds);
    
    // Insert text node right after SVG icon
    // Create text node
    const textNode = document.createTextNode(displayText);
    
    // Insert after SVG icon
    if (svgIcon.nextSibling) {
        // Insert before the next sibling
        timerBtn.insertBefore(textNode, svgIcon.nextSibling);
    } else {
        // No next sibling, append at the end (which is after SVG)
        timerBtn.appendChild(textNode);
    }
}

// Reset timer to initial state
function resetTimer() {
    // Clear any running interval
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    timerIsRunning = false;
    timerRemainingSeconds = 0;
}

// Start countdown timer
function startTimer() {
    const timerBtn = document.querySelector('.cooking-timer-btn');
    if (!timerBtn) return;
    
    // If timer is already running, do nothing
    if (timerIsRunning) return;
    
    // Get initial time from step or button text
    if (timerRemainingSeconds <= 0) {
        // Try to get from current step
        if (currentRecipe && currentRecipe.steps && currentRecipe.steps[currentStepIndex]) {
            const stepTime = currentRecipe.steps[currentStepIndex].time;
            if (stepTime) {
                timerRemainingSeconds = parseTimeString(stepTime);
            } else {
                // Fallback: read from button text
                const buttonText = timerBtn.textContent.trim();
                timerRemainingSeconds = parseTimeString(buttonText) || 0;
            }
        } else {
            // Fallback: read from button text
            const buttonText = timerBtn.textContent.trim();
            timerRemainingSeconds = parseTimeString(buttonText) || 0;
        }
    }
    
    if (timerRemainingSeconds <= 0) {
        return;
    }
    
    // Start the countdown
    timerIsRunning = true;
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        if (timerRemainingSeconds > 0) {
            timerRemainingSeconds--;
            updateTimerButtonText(timerRemainingSeconds);
        } else {
            // Timer reached 0
            clearInterval(timerInterval);
            timerInterval = null;
            timerIsRunning = false;
            
            // Update button to show "TIME'S UP"
            updateTimerButtonText(0);
            
            // Add visual feedback
            timerBtn.classList.add('timer-times-up');
            timerBtn.style.background = '#ffcc00';
            timerBtn.style.color = '#cc0000';
            
            // Keep the "time's up" state (don't remove after 2 seconds)
            // User can click again to restart if needed
        }
    }, 1000);
}

// Handle timer button click
function toggleTimer() {
    const timerBtn = document.querySelector('.cooking-timer-btn');
    if (!timerBtn) return;
    
    // If timer is at 0 and showing "TIME'S UP", reset to step time
    if (timerRemainingSeconds === 0 && !timerIsRunning && timerBtn.textContent.includes("TIME'S UP")) {
        // Reset to current step's time
        if (currentRecipe && currentRecipe.steps && currentRecipe.steps[currentStepIndex]) {
            const stepTime = currentRecipe.steps[currentStepIndex].time;
            if (stepTime) {
                timerRemainingSeconds = parseTimeString(stepTime);
                updateTimerButtonText(timerRemainingSeconds);
                timerBtn.classList.remove('timer-times-up');
                timerBtn.style.background = 'white';
                timerBtn.style.color = '#007AFF';
            }
        }
        return;
    }
    
    if (timerIsRunning) {
        // Stop the timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerIsRunning = false;
    } else {
        // Start the timer
        startTimer();
    }
}

// Setup timer button event listener (only once)
function setupTimerButton() {
    const timerBtn = document.querySelector('.cooking-timer-btn');
    if (!timerBtn) return;
    
    // Only attach listener once
    if (!timerBtn.hasAttribute('data-timer-listener')) {
        timerBtn.setAttribute('data-timer-listener', 'true');
        timerBtn.addEventListener('click', toggleTimer);
    }
}

// ===== VOICE NARRATION FUNCTIONS =====

// Global variable for speech synthesis
let speechSynthesis = null;
let currentUtterance = null;

// Initialize speech synthesis
function initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
        return true;
    } else {
        console.warn('Speech synthesis not supported in this browser');
        return false;
    }
}

// Stop current speech
function stopSpeech() {
    if (speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    currentUtterance = null;
}

// Speak the current step's instructions
function speakInstructions() {
    // Stop any ongoing speech first
    stopSpeech();
    
    if (!currentRecipe || !currentRecipe.steps || currentRecipe.steps.length === 0) {
        return;
    }
    
    const step = currentRecipe.steps[currentStepIndex];
    if (!step || !step.text) {
        return;
    }
    
    // Initialize speech synthesis if not already done
    if (!speechSynthesis) {
        if (!initSpeechSynthesis()) {
            alert('Your browser does not support voice narration.');
            return;
        }
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(step.text);
    
    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a more natural voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoices = voices.filter(voice => 
        voice.lang.includes('en') && 
        (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.name.includes('Neural'))
    );
    if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
    } else if (voices.length > 0) {
        // Fallback to first English voice
        const englishVoices = voices.filter(voice => voice.lang.includes('en'));
        if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
        }
    }
    
    // Store current utterance
    currentUtterance = utterance;
    
    // Speak
    speechSynthesis.speak(utterance);
    
    // Update button state
    updateVoiceNarrationButton(true);
    
    // Reset button state when speech ends
    utterance.onend = () => {
        currentUtterance = null;
        updateVoiceNarrationButton(false);
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        currentUtterance = null;
        updateVoiceNarrationButton(false);
    };
}

// Toggle voice narration (start/stop)
function toggleVoiceNarration() {
    if (speechSynthesis && speechSynthesis.speaking) {
        // Stop current speech
        stopSpeech();
        updateVoiceNarrationButton(false);
    } else {
        // Start speaking
        speakInstructions();
    }
}

// Update voice narration button appearance
function updateVoiceNarrationButton(isSpeaking) {
    // Select the first voice button (Voice Narration)
    const voiceButtons = document.querySelectorAll('.cooking-voice-btn');
    const voiceBtn = voiceButtons[0]; // First button is Voice Narration
    if (!voiceBtn) return;
    
    if (isSpeaking) {
        voiceBtn.textContent = '⏸️ Stop Narration';
        voiceBtn.style.background = '#e3f2fd';
        voiceBtn.style.borderColor = '#007AFF';
    } else {
        voiceBtn.textContent = '🔊 Voice Narration';
        voiceBtn.style.background = 'white';
        voiceBtn.style.borderColor = '#e0e0e0';
    }
}

// Setup voice narration button event listener
function setupVoiceNarration() {
    // Select the first voice button (Voice Narration)
    const voiceButtons = document.querySelectorAll('.cooking-voice-btn');
    const voiceBtn = voiceButtons[0]; // First button is Voice Narration
    if (!voiceBtn) return;
    
    // Initialize speech synthesis
    initSpeechSynthesis();
    
    // Load voices (some browsers need this)
    if (speechSynthesis) {
        // Chrome needs voices to be loaded
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                // Voices are now loaded
            });
        }
    }
    
    // Only attach listener once
    if (!voiceBtn.hasAttribute('data-voice-listener')) {
        voiceBtn.setAttribute('data-voice-listener', 'true');
        voiceBtn.addEventListener('click', toggleVoiceNarration);
    }
    
    // Stop speech when step changes
    // This is handled in renderCurrentStep by calling stopSpeech
}