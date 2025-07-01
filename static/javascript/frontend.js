document.addEventListener('DOMContentLoaded', function () {
  console.log("Hallo wereld");

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('closeBtn');

  if (hamburger && mobileMenu && closeBtn) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
    });

    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  }

  // List.js configuratie
  const listContainer = document.getElementById('account-opgeslagen-artiest-grid');
  let artiestenList = null;

  if (listContainer) {
    const options = {
      valueNames: ['name', 'genre', 'popularity']  
    };

    artiestenList = new List('account-opgeslagen-artiest-grid', options);

    // Zoekfunctie
    const searchInput = document.querySelector('#search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        artiestenList.search(searchInput.value);
      });
    }

    // Sorteer op naam A-Z
    const sortButtonAZ = document.querySelector('.sort');
    if (sortButtonAZ) {
      sortButtonAZ.addEventListener('click', () => {
        artiestenList.sort('name', { order: "asc" });
        // Herinitialiseer drag & drop na sorteren
        setTimeout(() => voegDragEventsToe(), 100);
      });
    }

    // Sorteer op naam Z-A
    const sortButtonZA = document.querySelector('.sort-low');
    if (sortButtonZA) {
      sortButtonZA.addEventListener('click', () => {
        artiestenList.sort('name', { order: "desc" });
        // Herinitialiseer drag & drop na sorteren
        setTimeout(() => voegDragEventsToe(), 100);
      });
    }

    // Sorteer op populariteit laag → hoog
    const sortLowButton = document.querySelector('.sort-popularity');
    if (sortLowButton) {
      sortLowButton.addEventListener('click', () => {
        artiestenList.sort('popularity', {
          order: "asc", // Gefixed: was "ssc"
          sortFunction: function (a, b) {
            const popA = parseInt(a.values().popularity) || 0;
            const popB = parseInt(b.values().popularity) || 0;
            return popA - popB;
          }
        });
        // Herinitialiseer drag & drop na sorteren
        setTimeout(() => voegDragEventsToe(), 100);
      });
    }
  }

  // Drag and drop logica
  const lijst = document.querySelector('#draggable-list');
  if (!lijst) return;

  let gesleept = null;

  function voegDragEventsToe() {
    // Verwijder oude event listeners
    lijst.querySelectorAll('.grid-item').forEach(item => {
      item.removeAttribute('draggable');
    });

    // Voeg nieuwe drag events toe
    lijst.querySelectorAll('.grid-item').forEach(item => {
      item.setAttribute('draggable', true);

      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });
  }

  function handleDragStart() {
    gesleept = this;
    this.classList.add('dragElem');
  }

  function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('over');
  }

  function handleDragLeave() {
    this.classList.remove('over');
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('over');

    if (gesleept && gesleept !== this) {
      const bounding = this.getBoundingClientRect();
      const offset = e.clientY - bounding.top;

      if (offset > bounding.height / 2) {
        lijst.insertBefore(gesleept, this.nextSibling);
      } else {
        lijst.insertBefore(gesleept, this);
      }

      slaNieuweVolgordeOp();
    }
  }

  function handleDragEnd() {
    this.classList.remove('dragElem');
    lijst.querySelectorAll('.grid-item').forEach(i => i.classList.remove('over'));
  }

  function slaNieuweVolgordeOp() {
    const ids = Array.from(lijst.querySelectorAll('.grid-item'))
      .map(item => item.dataset.id);

    // Gefixed: juiste route gebruiken
    fetch('/account/opgeslagen-artiesten/volgorde', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ nieuweVolgorde: ids })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Volgorde opgeslagen');
      } else {
        console.warn('Volgorde niet opgeslagen:', data.message);
      }
    })
    .catch(err => {
      console.error('Fout bij opslaan volgorde:', err);
      // Optioneel: toon gebruiker een melding
    });
  }

  // Initialiseer drag & drop
  voegDragEventsToe();

  // Maak voegDragEventsToe globaal beschikbaar voor na sorteren
  window.voegDragEventsToe = voegDragEventsToe;
});