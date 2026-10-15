/* =========================================================
   PIZZA FOOD — réglages
   ---------------------------------------------------------
   Avis Google en direct : renseignez une clé d'API Google
   Maps (Google Cloud > « Maps JavaScript API » et « Places
   API (New) » activées, clé restreinte au domaine du site).
   Si googlePlaceId est vide, la fiche est cherchée avec
   googlePlaceQuery. Sans clé, le bloc affiche un lien vers
   les avis Google (aucun avis n'est inventé).

   Codes promo : ajoutez-les ici, par exemple
     'BIENVENUE': { label: 'Bienvenue', percent: 10, min: 20 }
     'PIZZA5':    { label: '5 € offerts', amount: 5 }
   (percent = remise en %, amount = remise en €, min = achat minimum)
   ========================================================= */
window.PF_CONFIG = {
  googleMapsKey: '',
  googlePlaceId: '',
  googlePlaceQuery: 'Pizza Food, 34 Rue du Général de Gaulle, 94430 Chennevières-sur-Marne',
  promoCodes: {}
};
