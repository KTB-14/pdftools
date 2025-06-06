# deploy/apache

## A PROPOS / OBJECTIFS
Configuration Apache pour servir le frontend statique et proxyfier les requêtes API vers FastAPI.

## SCOPE
Admins système utilisant Apache comme reverse proxy.

## PRÉREQUIS
- Apache2 installé
- Droits sudo pour modifier `/etc/apache2`

## CONTENU DU DOSSIER
- `pdftools.conf` : virtual host à déployer dans `/etc/apache2/sites-available/`.

## INSTRUCTIONS PRINCIPALES
Activer le site via `a2ensite pdftools.conf` puis recharger Apache. Le script `deploy/scripts/04_apache.sh` réalise ces étapes automatiquement.

## NOTES
Le virtual host pointe sur `frontend/` pour le contenu statique et redirige `/api` vers le backend sur localhost.


