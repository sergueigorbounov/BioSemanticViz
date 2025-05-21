#!/bin/bash

# Activer l'environnement virtuel si nécessaire
# source venv/bin/activate

# Exécuter les tests de performance
python -m pytest tests/test_performance.py -v

# Afficher un résumé des résultats
echo "Performance tests completed!" 