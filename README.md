# iCube Project

iCube-Project is a 3D mesh sculpting and manipulation tool that uses **Dual Quaternions** to perform geometric transformations. The project implements a subdivision method, specifically the **Catmull-Clark** method, for refining meshes.

## Features

- **3D Sculpting**: Allows users to interactively manipulate 3D meshes.
- **Catmull-Clark Subdivision**: Utilizes this method to refine meshes and improve their visual quality.
- **File Exporting**: Generates `.off` (Object File Format) files available in the `Files` directory, facilitating the sharing and use of created meshes.

## Project Status

This project is currently in **prototype** stage. Although it already offers some features, there are still several elements to improve:

- **Bugs**: The code still has some bugs that need to be fixed.
- **Performance**: The process can become slow when subdividing meshes with a high number of vertices, which may affect the user experience.

## Installation

To use iCube, clone this repository and open the `index.html` file in your browser. Make sure you have an environment compatible with Three.js.

```bash
git clone https://git.unistra.fr/razafindrambola/ICube-project
```
## Usage

- Load or create a 3D mesh.
- Apply transformations using the available tools.
- Use the subdivision function to refine the mesh.
- Export the mesh as a `.off` file for later use.

## Dependencies

This project uses the library [CMapJS](https://github.com/paulviville/CMapJS), which is licensed under the MIT license.

- **CMapJS**: A mind map management tool used to manage meshes with **JavaScript** ([Paul Viville](https://github.com/paulviville)).

## License

This project is licensed under the MIT License - see the LICENSE file for more details.

## Contact

For any questions or suggestions, you can contact me at [nilaina.razafindrambola@etu.unistra.fr](mailto:nilaina.razafindrambola@etu.unistra.fr).

Thank you for taking the time to explore the iCube project!


-----------------------------

# iCube Project

iCube-Project est un outil de sculpture et de manipulation 3D de maillage qui utilise des **Dual Quaternions** pour effectuer des transformations géométriques. Le projet implémente une méthode de subdivision, spécifiquement la méthode **Catmull-Clark**, pour l'affinage des maillages. 

## Fonctionnalités

- **Sculpture 3D** : Permet aux utilisateurs de manipuler des maillages 3D de manière interactive.
- **Subdivision de Catmull-Clark** : Utilise cette méthode pour affiner les maillages et améliorer leur qualité visuelle.
- **Exportation de fichiers** : Génère des fichiers `.off` (Object File Format) disponibles dans le répertoire `Files`, facilitant le partage et l'utilisation des maillages créés.

## État du projet

Ce projet est actuellement à l'état de **prototype**. Bien qu'il offre déjà certaines fonctionnalités, il reste encore plusieurs éléments à améliorer :

- **Bugs** : Le code présente encore quelques bugs qui nécessitent d'être corrigés.
- **Performance** : Le processus peut devenir lent lors de la subdivision de maillages comportant un nombre élevé de sommets, ce qui peut affecter l'expérience utilisateur.

## Installation

Pour utiliser iCube, clonez ce dépôt et ouvrez le fichier `index.html` dans votre navigateur. Assurez-vous d'avoir un environnement compatible avec Three.js.

```bash
git clone https://git.unistra.fr/razafindrambola/ICube-project
```

## Utilisation

- Chargez ou créez un maillage 3D.
- Appliquez des transformations en utilisant les outils disponibles.
- Utilisez la fonction de subdivision pour affiner le maillage.
- Exportez le maillage sous forme de fichier `.off` pour un usage ultérieur.

## Dépendances

Ce projet utilise la bibliothèque [CMapJS](https://github.com/paulviville/CMapJS), qui est sous licence MIT.

- **CMapJS** : Outil de gestion de cartes mentales, utilisé pour gérer les maillages avec **JavaScript** ([Paul Viville](https://github.com/paulviville)).

## License

Ce projet est sous la licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.


## Contact

Pour toute question ou suggestion, vous pouvez me contacter à [nilaina.razafindrambola@etu.unistra.fr](mailto:nilaina.razafindrambola@etu.unistra.fr).

Merci d'avoir pris le temps d'explorer le projet iCube !
