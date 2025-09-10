// ====== INICJALIZACJA APLIKACJI ======

// Po załadowaniu DOM inicjalizuj aplikację
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Sprawdź czy główne elementy istnieją
    const voiceBtn = document.getElementById('voiceBtn');
    const categories = document.getElementById('cats');
    
    if (!voiceBtn || !categories) {
        console.log('Główne elementy nie znalezione, używam starych elementów...');
        return;
    }

    // Obsługa przycisku głosowego
    voiceBtn.addEventListener('click', function() {
        if (typeof toggleListen === 'function') {
            toggleListen();
            
            // Zmiana wyglądu przycisku podczas nasłuchiwania
            if (listening) {
                voiceBtn.classList.add('listening');
                voiceBtn.querySelector('.voice-text').textContent = 'Słucham...';
            } else {
                voiceBtn.classList.remove('listening');
                voiceBtn.querySelector('.voice-text').textContent = 'Naciśnij i mów';
            }
        }
    });

    // Obsługa kategorii (delegowana już w app.js)
    
    // Aktualizuj referencje dla starych skryptów
    updateLegacyRefs();
    
    console.log('Aplikacja została zainicjalizowana');
}

// Funkcja aktualizująca referencje dla starych skryptów
function updateLegacyRefs() {
    // Upewnij się, że stare zmienne wskazują na nowe elementy
    if (typeof window.logoEl === 'undefined') {
        window.logoEl = document.getElementById('voiceBtn');
    }
}

// Funkcja pokazująca wyniki wyszukiwania
function showResults(results) {
    const resultsContainer = document.getElementById('results');
    const resultsList = document.getElementById('resultsList');
    
    if (!resultsContainer || !resultsList) return;
    
    if (!results || results.length === 0) {
        resultsContainer.classList.add('hidden');
        return;
    }
    
    resultsList.innerHTML = '';
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div class="result-title">${result.title}</div>
            <div class="result-description">${result.description}</div>
            <div class="result-price">${result.price || 'Cena do uzgodnienia'}</div>
        `;
        resultsList.appendChild(item);
    });
    
    resultsContainer.classList.remove('hidden');
}

// Export funkcji dla innych skryptów
window.showResults = showResults;
window.initializeApp = initializeApp;
