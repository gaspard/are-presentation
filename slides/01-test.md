Le modèle de base est défini par deux équations différentielles non linéaires :

$$
\begin{aligned}
  \frac{dx}{dt} & = \alpha x - \beta xy \quad \text{(croissance des proies avec prédation)} \\
  \frac{dy}{dt} & = \delta xy - \gamma y \quad \text{(croissance des prédateurs dépendant des proies)}
\end{aligned}
$$

Où :

- $x$ est la population des proies.
- $y$ est la population des prédateurs.
- $\alpha, \beta, \gamma, \delta$ sont des paramètres positifs.

## Points d'équilibre

Les points d'équilibre sont obtenus en annulant les dérivées :

- $x^* = 0, y^* = 0$ : extinction totale.
- $x^* = \frac{\gamma}{\delta}, y^* = \frac{\alpha}{\beta}$ : coexistence stable.

## Matrice Jacobienne

La matrice Jacobienne est construite à partir des dérivées partielles des équations par rapport à $x$ et $y$. Elle représente les interactions locales entre les populations autour d'un point donné.

Pour le système Lotka-Volterra, elle s'écrit :

$$
J(x, y) =
\begin{pmatrix}
\frac{\partial}{\partial x} (\alpha x - \beta xy) & \frac{\partial}{\partial y} (\alpha x - \beta xy) \\
\frac{\partial}{\partial x} (\delta xy - \gamma y) & \frac{\partial}{\partial y} (\delta xy - \gamma y)
\end{pmatrix}
$$

En calculant les dérivées partielles :

$$
J(x, y) =
\begin{pmatrix}
\alpha - \beta y & -\beta x \\
\delta y & \delta x - \gamma
\end{pmatrix}
$$

## Analyse de stabilité

Pour évaluer la stabilité d'un point d'équilibre, on calcule les valeurs propres de la matrice Jacobienne au point considéré :

### Extinction totale ($x^* = 0, y^* = 0$)

La Jacobienne devient :

$$
J(0, 0) =
\begin{pmatrix}
\alpha & 0 \\
0 & -\gamma
\end{pmatrix}
$$

Les valeurs propres sont $\alpha > 0, -\gamma < 0$, indiquant que ce point est un **point selle instable**.

### Coexistence stable ($x^* = \frac{\gamma}{\delta}, y^* = \frac{\alpha}{\beta}$)

La Jacobienne devient :

$$
J(x^*, y^*) =
\begin{pmatrix}
0 & -\beta x^* \\
\delta y^* & 0
\end{pmatrix}
$$

Les valeurs propres sont imaginaires pures, ce qui implique une **stabilité neutre** avec oscillations périodiques.

## Importance biologique

La matrice Jacobienne permet de comprendre :

- Comment les populations interagissent localement.
- Si un équilibre est stable ou instable.
- La dynamique autour des points critiques (oscillations ou divergence).

Ce type d'analyse est essentiel pour modéliser la dynamique écologique et prédire l'évolution des populations dans des systèmes complexes.
