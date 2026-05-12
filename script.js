let carData = [];      // To store the cars from our JSON
let currentCar = null; // The car the user is currently guessing
let imageIndex = 0;    // Which photo index are we on?
let startTime = 0;     // To track the time bonus
let currentShareText = ''; // For copying the score

/* 
const fallbackCarData = [
    {
        id: 1,
        make: 'Subaru',
        model: 'WRX',
        year: 2022,
        images: ['images/wrx22bsti1998.jpg'],
        difficulty: 'Medium'
    }
];
*/

// 1. Fetch the "Database"
async function initGame() {
    try {
        const response = await fetch('cars.json');
        carData = await response.json();
        populateMakes();
        startNewRound();
    } catch (error) {
        console.error("Could not load car data:", error);
        console.warn("Using fallback car data.");
        carData = fallbackCarData;
        populateMakes();
        startNewRound();
    }
}

// Get daily car based on date
function getDailyCar() {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return carData[day % carData.length];
}

// Populate make dropdown
function populateMakes() {
    const makeSelect = document.getElementById('makeSelect');
    const makes = [...new Set(carData.map(car => car.make))];
    makes.forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.textContent = make;
        makeSelect.appendChild(option);
    });
    makeSelect.addEventListener('change', populateModels);
}

// Populate model dropdown based on selected make
function populateModels() {
    const makeSelect = document.getElementById('makeSelect');
    const modelSelect = document.getElementById('modelSelect');
    const selectedMake = makeSelect.value;
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    modelSelect.disabled = !selectedMake;
    if (selectedMake) {
        const models = carData.filter(car => car.make === selectedMake).map(car => car.model);
        [...new Set(models)].forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }
}

// Copy score to clipboard
function copyScore() {
    navigator.clipboard.writeText(currentShareText).then(() => {
        alert("Score copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy score.");
    });
}

// 2. Setup a New Round
function startNewRound() {
    // Pick the daily car
    currentCar = getDailyCar();
    imageIndex = 0; 
    
    // Start the high-precision timer
    startTime = performance.now();
    
    // Reset guess fields
    document.getElementById('makeSelect').value = '';
    document.getElementById('modelSelect').value = '';
    document.getElementById('modelSelect').disabled = true;
    document.getElementById('yearInput').value = '';
    document.getElementById('guessButton').disabled = false;
    
    // Hide results
    document.getElementById('results').style.display = 'none';
    
    updateDisplay();
}

// 3. Update the HTML Image
function updateDisplay() {
    const display = document.getElementById('carDisplay');
    
    // Inject the image URL from our current car object
    display.src = currentCar.images[imageIndex];
    display.alt = `Angle ${imageIndex + 1} of the mystery car`;
}

// 4. Handle "Next Angle" Button
function showNextAngle() {
    if (imageIndex < currentCar.images.length - 1) {
        imageIndex++;
        updateDisplay();
    } else {
        alert("No more angles available for this car!");
    }
}

// 5. Check the Guess & Calculate Score
function submitGuess() {
    const makeGuess = document.getElementById('makeSelect').value;
    const modelGuess = document.getElementById('modelSelect').value;
    const yearGuess = parseInt(document.getElementById('yearInput').value);

    if (!makeGuess || !modelGuess || isNaN(yearGuess)) {
        alert("Please fill in all fields: Make, Model, and Year.");
        return;
    }

    if (yearGuess < 1880 || yearGuess > 2051) {
        alert("Year must be between 1880 and 2051.");
        return;
    }

    let endTime = performance.now();
    let secondsTaken = (endTime - startTime) / 1000;
    
    // New SCORING LOGIC:
    let yearDiff = Math.abs(yearGuess - currentCar.year);
    let yearPoints = Math.max(0, 300 - (yearDiff * 30)); // Lose 30 points per year off
    let makePoints = (makeGuess === currentCar.make) ? 100 : 0;
    let modelPoints = (modelGuess === currentCar.model) ? 200 : 0;
    let multiplier = Math.max(0, 2.0 - (secondsTaken / 10));
    let totalPoints = Math.round((yearPoints + makePoints + modelPoints) * multiplier);
    
    let shareText = `MoneyShift.gg \nYear +${yearPoints}\nMake +${makePoints}\nModel +${modelPoints}\nTime x${multiplier.toFixed(1)}\nTotal: ${totalPoints} points in ${secondsTaken.toFixed(1)}s`;
    
    currentShareText = shareText;
    document.getElementById('scoreText').textContent = shareText;
    document.getElementById('correctAnswer').textContent = `Correct: ${currentCar.year} ${currentCar.make} ${currentCar.model}`;
    document.getElementById('results').style.display = 'block';
    document.getElementById('guessButton').disabled = true;
}

// Enforce 4-digit limit on year input
document.addEventListener('DOMContentLoaded', function() {
    const yearInput = document.getElementById('yearInput');
    yearInput.addEventListener('input', function() {
        if (this.value.length > 4) {
            this.value = this.value.slice(0, 4);
        }
    });
});

// Initialize the game when the page loads
initGame();