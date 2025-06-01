// Gestion des cartes désactivées
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', e => {
    if (card.classList.contains('disabled')) {
      e.preventDefault();
      alert('Ce service sera bientôt disponible !');
    }
  });
}); 
