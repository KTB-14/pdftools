// Redirige à la page choisie ou affiche un message
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', e => {
    if (card.classList.contains('disabled')) {
      alert('Service à venir bientôt !');
      e.preventDefault();
    }
  });
});
