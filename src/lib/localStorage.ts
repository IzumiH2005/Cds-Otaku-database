/**
 * Version de localStorage.ts spécifique pour le déploiement
 * 
 * Ce fichier est une version simplifiée qui importe toutes ses
 * fonctionnalités à partir de storageCompatLayer.ts, qui est
 * spécifiquement conçu pour fonctionner dans un environnement
 * de déploiement sécurisé.
 */

export * from './storageCompatLayer';