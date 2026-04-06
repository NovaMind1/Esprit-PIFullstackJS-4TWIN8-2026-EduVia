export const LEVEL_ASSESSMENT_FALLBACK_QUESTIONS = [
    {
        "id":  "algo",
        "subject":  "Algorithmique",
        "prompt":  "Quel principe permet de decomposer un probleme en sous-problemes plus petits de meme nature ?",
        "hint":  "Cette idee est fondamentale pour beaucoup dalgorithmes efficaces.",
        "options":  [
                        {
                            "id":  "algo-a",
                            "label":  "Diviser pour regner"
                        },
                        {
                            "id":  "algo-b",
                            "label":  "Boucle infinie"
                        },
                        {
                            "id":  "algo-c",
                            "label":  "Programmation lineaire"
                        },
                        {
                            "id":  "algo-d",
                            "label":  "Compilation separee"
                        }
                    ]
    },
    {
        "id":  "reseau",
        "subject":  "Reseaux",
        "prompt":  "Quel protocole est principalement utilise pour transporter des pages web securisees ?",
        "hint":  "Il sagit de la version securisee du protocole web classique.",
        "options":  [
                        {
                            "id":  "reseau-a",
                            "label":  "FTP"
                        },
                        {
                            "id":  "reseau-b",
                            "label":  "HTTPS"
                        },
                        {
                            "id":  "reseau-c",
                            "label":  "SMTP"
                        },
                        {
                            "id":  "reseau-d",
                            "label":  "ARP"
                        }
                    ]
    },
    {
        "id":  "complexite",
        "subject":  "Complexite",
        "prompt":  "Quelle est la complexite temporelle dune recherche dichotomique dans un tableau trie ?",
        "hint":  "La taille du probleme est divisee par deux a chaque etape.",
        "options":  [
                        {
                            "id":  "complexite-a",
                            "label":  "O(n)"
                        },
                        {
                            "id":  "complexite-b",
                            "label":  "O(log n)"
                        },
                        {
                            "id":  "complexite-c",
                            "label":  "O(n log n)"
                        },
                        {
                            "id":  "complexite-d",
                            "label":  "O(1)"
                        }
                    ]
    },
    {
        "id":  "angular",
        "subject":  "Angular",
        "prompt":  "Dans Angular, quel decorateur declare un composant ?",
        "hint":  "Il est place au-dessus de la classe pour definir son template et ses metadonnees.",
        "options":  [
                        {
                            "id":  "angular-a",
                            "label":  "@Injectable"
                        },
                        {
                            "id":  "angular-b",
                            "label":  "@NgModule"
                        },
                        {
                            "id":  "angular-c",
                            "label":  "@Component"
                        },
                        {
                            "id":  "angular-d",
                            "label":  "@DirectiveModule"
                        }
                    ]
    },
    {
        "id":  "react",
        "subject":  "React",
        "prompt":  "Quel hook React permet de memoriser un etat local dans un composant fonctionnel ?",
        "hint":  "Cest souvent le premier hook appris dans React.",
        "options":  [
                        {
                            "id":  "react-a",
                            "label":  "useMemo"
                        },
                        {
                            "id":  "react-b",
                            "label":  "useRef"
                        },
                        {
                            "id":  "react-c",
                            "label":  "useState"
                        },
                        {
                            "id":  "react-d",
                            "label":  "useContext"
                        }
                    ]
    },
    {
        "id":  "gestion-projet",
        "subject":  "Gestion de projet",
        "prompt":  "Quel outil sert a decouper un projet en lots de travail organisables ?",
        "hint":  "Il est souvent utilise au debut pour planifier le projet.",
        "options":  [
                        {
                            "id":  "gp-a",
                            "label":  "WBS"
                        },
                        {
                            "id":  "gp-b",
                            "label":  "DNS"
                        },
                        {
                            "id":  "gp-c",
                            "label":  "CPU scheduler"
                        },
                        {
                            "id":  "gp-d",
                            "label":  "ORM"
                        }
                    ]
    },
    {
        "id":  "c",
        "subject":  "Langage C",
        "prompt":  "Quel mot-cle reserve permet de definir une constante en C ?",
        "hint":  "Il empeche la modification de la variable apres son initialisation.",
        "options":  [
                        {
                            "id":  "c-a",
                            "label":  "static"
                        },
                        {
                            "id":  "c-b",
                            "label":  "volatile"
                        },
                        {
                            "id":  "c-c",
                            "label":  "const"
                        },
                        {
                            "id":  "c-d",
                            "label":  "final"
                        }
                    ]
    },
    {
        "id":  "java",
        "subject":  "Java",
        "prompt":  "Quel concept permet a une classe de reutiliser les attributs et methodes dune autre classe en Java ?",
        "hint":  "Il sagit dun pilier de la programmation orientee objet.",
        "options":  [
                        {
                            "id":  "java-a",
                            "label":  "Surcharge"
                        },
                        {
                            "id":  "java-b",
                            "label":  "Heritage"
                        },
                        {
                            "id":  "java-c",
                            "label":  "Compilation"
                        },
                        {
                            "id":  "java-d",
                            "label":  "Encodage"
                        }
                    ]
    },
    {
        "id":  "cpp",
        "subject":  "C++",
        "prompt":  "Quelle fonctionnalite du C++ permet de definir plusieurs fonctions avec le meme nom mais des parametres differents ?",
        "hint":  "Cest une facon davoir plusieurs signatures pour une meme intention.",
        "options":  [
                        {
                            "id":  "cpp-a",
                            "label":  "Template metaprogramming"
                        },
                        {
                            "id":  "cpp-b",
                            "label":  "Surcharge de fonctions"
                        },
                        {
                            "id":  "cpp-c",
                            "label":  "Pointeurs intelligents"
                        },
                        {
                            "id":  "cpp-d",
                            "label":  "Compilation separee"
                        }
                    ]
    },
    {
        "id":  "python",
        "subject":  "Python",
        "prompt":  "Quel type de donnees Python est mutable et ordonne ?",
        "hint":  "On lutilise tres souvent pour stocker une suite delements.",
        "options":  [
                        {
                            "id":  "python-a",
                            "label":  "tuple"
                        },
                        {
                            "id":  "python-b",
                            "label":  "set"
                        },
                        {
                            "id":  "python-c",
                            "label":  "list"
                        },
                        {
                            "id":  "python-d",
                            "label":  "str"
                        }
                    ]
    },
    {
        "id":  "graph",
        "subject":  "Graphes",
        "prompt":  "Dans un graphe oriente, comment appelle-t-on un lien entre deux sommets ?",
        "hint":  "Le terme change legerement par rapport au graphe non oriente.",
        "options":  [
                        {
                            "id":  "graph-a",
                            "label":  "Une matrice"
                        },
                        {
                            "id":  "graph-b",
                            "label":  "Un arc"
                        },
                        {
                            "id":  "graph-c",
                            "label":  "Un arbre"
                        },
                        {
                            "id":  "graph-d",
                            "label":  "Un chemin critique"
                        }
                    ]
    },
    {
        "id":  "pl",
        "subject":  "Programmation lineaire",
        "prompt":  "Quel element cherche-t-on en general a maximiser ou minimiser en programmation lineaire ?",
        "hint":  "Il represente lobjectif mathematique du probleme.",
        "options":  [
                        {
                            "id":  "pl-a",
                            "label":  "La fonction objectif"
                        },
                        {
                            "id":  "pl-b",
                            "label":  "Le compilateur"
                        },
                        {
                            "id":  "pl-c",
                            "label":  "La pile memoire"
                        },
                        {
                            "id":  "pl-d",
                            "label":  "Le graphe de dependances"
                        }
                    ]
    },
    {
        "id":  "bdd",
        "subject":  "Bases de donnees",
        "prompt":  "Quelle commande SQL permet de recuperer des donnees dans une table ?",
        "hint":  "Cest la commande la plus utilisee en consultation.",
        "options":  [
                        {
                            "id":  "bdd-a",
                            "label":  "INSERT"
                        },
                        {
                            "id":  "bdd-b",
                            "label":  "DELETE"
                        },
                        {
                            "id":  "bdd-c",
                            "label":  "SELECT"
                        },
                        {
                            "id":  "bdd-d",
                            "label":  "MERGE"
                        }
                    ]
    },
    {
        "id":  "electronique",
        "subject":  "Electronique",
        "prompt":  "Quelle grandeur s’exprime en volts ?",
        "hint":  "On la mesure souvent entre deux bornes dun composant.",
        "options":  [
                        {
                            "id":  "elec-a",
                            "label":  "Lintensite"
                        },
                        {
                            "id":  "elec-b",
                            "label":  "La tension"
                        },
                        {
                            "id":  "elec-c",
                            "label":  "La puissance reactive"
                        },
                        {
                            "id":  "elec-d",
                            "label":  "La frequence"
                        }
                    ]
    },
    {
        "id":  "proba",
        "subject":  "Probabilite",
        "prompt":  "Quelle est la probabilite dun evenement certain ?",
        "hint":  "La reponse correspond a la valeur maximale en probabilite classique.",
        "options":  [
                        {
                            "id":  "proba-a",
                            "label":  "0"
                        },
                        {
                            "id":  "proba-b",
                            "label":  "0,5"
                        },
                        {
                            "id":  "proba-c",
                            "label":  "1"
                        },
                        {
                            "id":  "proba-d",
                            "label":  "10"
                        }
                    ]
    },
    {
        "id":  "analyse-num",
        "subject":  "Analyse numerique",
        "prompt":  "A quoi sert principalement la methode de Newton ?",
        "hint":  "Elle repose sur des tangentes successives.",
        "options":  [
                        {
                            "id":  "an-a",
                            "label":  "Trier un tableau"
                        },
                        {
                            "id":  "an-b",
                            "label":  "Resoudre numeriquement f(x)=0"
                        },
                        {
                            "id":  "an-c",
                            "label":  "Calculer une integrale symbolique exacte"
                        },
                        {
                            "id":  "an-d",
                            "label":  "Trouver la matrice inverse sans erreur"
                        }
                    ]
    },
    {
        "id":  "microservices",
        "subject":  "Microservices",
        "prompt":  "Quel avantage est typiquement associe a une architecture microservices ?",
        "hint":  "On parle souvent dindependance entre plusieurs briques.",
        "options":  [
                        {
                            "id":  "ms-a",
                            "label":  "Tout mettre dans une seule application monolithique"
                        },
                        {
                            "id":  "ms-b",
                            "label":  "Deployer chaque service independamment"
                        },
                        {
                            "id":  "ms-c",
                            "label":  "Supprimer toute communication reseau"
                        },
                        {
                            "id":  "ms-d",
                            "label":  "Eviter les API"
                        }
                    ]
    },
    {
        "id":  "spring-boot",
        "subject":  "Spring Boot",
        "prompt":  "Quel est le principal interet de Spring Boot ?",
        "hint":  "Il simplifie la mise en place des applications Spring.",
        "options":  [
                        {
                            "id":  "sb-a",
                            "label":  "Ecrire uniquement du frontend"
                        },
                        {
                            "id":  "sb-b",
                            "label":  "Configurer rapidement une application Java backend prete a demarrer"
                        },
                        {
                            "id":  "sb-c",
                            "label":  "Compiler du C++"
                        },
                        {
                            "id":  "sb-d",
                            "label":  "Remplacer une base de donnees"
                        }
                    ]
    }
] as const;

