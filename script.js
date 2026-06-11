/**
 * Calculatrice Scientifique Premium - Logique Applicative
 * Implémente un analyseur syntaxique robuste (Shunting-Yard)
 * et gère les interactions utilisateur, l'historique et l'affichage.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const ecranFormule = document.getElementById('ecran-formule');
    const ecranResultat = document.getElementById('ecran-resultat');
    const btnMode = document.getElementById('btn-mode');
    const btnHistoryToggle = document.getElementById('btn-history-toggle');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const drawerHistory = document.getElementById('drawer-historique');
    const historyList = document.getElementById('history-list');
    const noHistoryMsg = document.getElementById('no-history-msg');
    
    // État de l'application
    let expression = ''; // Expression mathématique interne
    let lastResult = null; // Stocke le dernier résultat de calcul (pour Ans)
    let isDegreeMode = true; // Par défaut, mode Degrés
    let isEvaluated = false; // Vrai si le résultat affiché vient d'être calculé
    let historique = JSON.parse(localStorage.getItem('calc_history')) || [];

    // Initialisation
    updateDisplay();
    renderHistory();
    if (isDegreeMode) {
        btnMode.classList.add('active-mode');
    }

    // --- COMMUTATEUR RADIAN / DEGRÉ ---
    btnMode.addEventListener('click', () => {
        isDegreeMode = !isDegreeMode;
        btnMode.textContent = isDegreeMode ? 'DEG' : 'RAD';
        if (isDegreeMode) {
            btnMode.classList.add('active-mode');
        } else {
            btnMode.classList.remove('active-mode');
        }
        
        // Si on a déjà évalué une formule, on la recalcule dans le nouveau mode
        if (isEvaluated && expression !== '') {
            recalculate();
        }
    });

    // --- TIROIR D'HISTORIQUE ---
    btnHistoryToggle.addEventListener('click', () => {
        drawerHistory.classList.add('open');
    });

    btnCloseHistory.addEventListener('click', () => {
        drawerHistory.classList.remove('open');
    });

    btnClearHistory.addEventListener('click', () => {
        historique = [];
        localStorage.removeItem('calc_history');
        renderHistory();
    });

    // --- GESTION DES BOUTONS DE LA CALCULATRICE ---
    const buttons = document.querySelectorAll('#boutons button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.id;
            handleAction(action, button.textContent.trim());
        });
    });

    // --- SUPPORT DU CLAVIER ---
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        
        if (/[0-9]/.test(key)) {
            handleAction(`btn-${key}`, key);
        } else if (key === '.') {
            handleAction('btn-dot', '.');
        } else if (key === '+') {
            handleAction('btn-add', '+');
        } else if (key === '-') {
            handleAction('btn-sub', '-');
        } else if (key === '*') {
            handleAction('btn-mul', '×');
        } else if (key === '/') {
            handleAction('btn-div', '÷');
        } else if (key === '%' || key === 'm') {
            handleAction('btn-mod', 'mod');
        } else if (key === '^') {
            handleAction('btn-power', '^');
        } else if (key === '!') {
            handleAction('btn-fact', '!');
        } else if (key === '(') {
            handleAction('btn-lparen', '(');
        } else if (key === ')') {
            handleAction('btn-rparen', ')');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            handleAction('btn-equal', '=');
        } else if (key === 'Backspace') {
            handleAction('btn-backspace', '');
        } else if (key === 'Escape' || key.toLowerCase() === 'c') {
            handleAction('btn-clear', '');
        } else if (key.toLowerCase() === 's') {
            handleAction('btn-sin', 'sin');
        } else if (key.toLowerCase() === 'o') {
            handleAction('btn-cos', 'cos');
        } else if (key.toLowerCase() === 't') {
            handleAction('btn-tan', 'tan');
        } else if (key.toLowerCase() === 'l') {
            handleAction('btn-log', 'log');
        } else if (key.toLowerCase() === 'n') {
            handleAction('btn-ln', 'ln');
        } else if (key.toLowerCase() === 'p') {
            handleAction('btn-pi', 'π');
        } else if (key.toLowerCase() === 'e') {
            handleAction('btn-e', 'e');
        } else if (key.toLowerCase() === 'q') {
            handleAction('btn-sqrt', '√');
        }
    });

    /**
     * Traite l'action demandée par un bouton ou une touche du clavier.
     */
    function handleAction(id, text) {
        // Effets haptiques / visuels d'action
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('active');
            setTimeout(() => element.classList.remove('active'), 100);
        }

        // Si le calcul vient d'être fait et qu'on saisit un chiffre ou une constante, on réinitialise l'écran
        if (isEvaluated) {
            if (id.startsWith('btn-') && /[0-9]/.test(id.slice(-1)) || id === 'btn-pi' || id === 'btn-e' || id === 'btn-dot' || id === 'btn-lparen' || id === 'btn-sin' || id === 'btn-cos' || id === 'btn-tan' || id === 'btn-ln' || id === 'btn-log' || id === 'btn-sqrt') {
                expression = '';
            }
            isEvaluated = false;
        }

        switch (id) {
            case 'btn-clear':
                expression = '';
                updateDisplay();
                break;
                
            case 'btn-backspace':
                if (expression.length > 0) {
                    // Si on supprime une fonction scientifique comme "sin(", "cos(", "tan(", "ln(", "log(", "sqrt("
                    // On essaie de supprimer le bloc d'un coup pour l'expérience utilisateur
                    const matchFunc = expression.match(/(sin\(|cos\(|tan\(|log\(|ln\(|sqrt\()$/);
                    if (matchFunc) {
                        expression = expression.slice(0, -matchFunc[0].length);
                    } else {
                        expression = expression.slice(0, -1);
                    }
                }
                updateDisplay();
                break;
                
            case 'btn-equal':
                evaluateExpression();
                break;
                
            case 'btn-neg':
                expression = toggleSign(expression);
                updateDisplay();
                break;
                
            case 'btn-sin':
                expression += 'sin(';
                updateDisplay();
                break;
            case 'btn-cos':
                expression += 'cos(';
                updateDisplay();
                break;
            case 'btn-tan':
                expression += 'tan(';
                updateDisplay();
                break;
            case 'btn-ln':
                expression += 'ln(';
                updateDisplay();
                break;
            case 'btn-log':
                expression += 'log(';
                updateDisplay();
                break;
            case 'btn-sqrt':
                expression += 'sqrt(';
                updateDisplay();
                break;
                
            case 'btn-power':
                expression += '^';
                updateDisplay();
                break;
                
            case 'btn-sqr':
                expression += '^2';
                updateDisplay();
                break;
                
            case 'btn-fact':
                expression += '!';
                updateDisplay();
                break;
                
            case 'btn-pi':
                expression += 'π';
                updateDisplay();
                break;
                
            case 'btn-e':
                expression += 'e';
                updateDisplay();
                break;
                
            case 'btn-ans':
                if (lastResult !== null) {
                    expression += 'Ans';
                } else {
                    expression += '0';
                }
                updateDisplay();
                break;

            case 'btn-mod':
                expression += '%';
                updateDisplay();
                break;
                
            case 'btn-add':
                expression += '+';
                updateDisplay();
                break;
            case 'btn-sub':
                expression += '-';
                updateDisplay();
                break;
            case 'btn-mul':
                expression += '*';
                updateDisplay();
                break;
            case 'btn-div':
                expression += '/';
                updateDisplay();
                break;
                
            default:
                // Pour les chiffres et parenthèses/points
                if (text && text !== '=' && text !== '±' && text !== 'DEG' && text !== 'RAD') {
                    expression += text;
                }
                updateDisplay();
                break;
        }
    }

    /**
     * Alterne le signe (+/-) du dernier nombre saisi dans l'expression
     */
    function toggleSign(expr) {
        if (expr === '') return '-';
        
        // Regex recherchant le dernier nombre à la fin de l'expression
        // (y compris décimaux, π, e, Ans)
        const numRegex = /(-)?([0-9.]+|π|e|Ans)$/;
        const match = expr.match(numRegex);
        
        if (match) {
            const fullMatch = match[0];
            const hasMinus = match[1];
            const rest = match[2];
            const exprWithoutLast = expr.slice(0, -fullMatch.length);
            
            if (hasMinus) {
                return exprWithoutLast + rest;
            } else {
                return exprWithoutLast + '-' + rest;
            }
        } else {
            // Si l'expression se termine par un opérateur ou une parenthèse, on ajoute simplement '-'
            return expr + '-';
        }
    }

    /**
     * Formate l'expression interne en chaîne de caractères propre pour l'affichage
     */
    function formatDisplayExpression(expr) {
        if (expr === '') return '';
        
        return expr
            .replace(/\*/g, ' × ')
            .replace(/\//g, ' ÷ ')
            .replace(/%/g, ' mod ')
            .replace(/\^/g, '^')
            .replace(/sqrt\(/g, '√(')
            .replace(/pi/g, 'π')
            .replace(/Ans/g, 'Ans')
            .replace(/sin\(/g, 'sin(')
            .replace(/cos\(/g, 'cos(')
            .replace(/tan\(/g, 'tan(')
            .replace(/ln\(/g, 'ln(')
            .replace(/log\(/g, 'log(');
    }

    /**
     * Met à jour les écrans de la calculatrice
     */
    function updateDisplay() {
        ecranFormule.textContent = formatDisplayExpression(expression);
        
        // Ajustement automatique de la taille de police sur le grand écran
        const textLen = ecranResultat.textContent.length;
        if (textLen > 16) {
            ecranResultat.style.fontSize = '1.3rem';
        } else if (textLen > 12) {
            ecranResultat.style.fontSize = '1.7rem';
        } else {
            ecranResultat.style.fontSize = '2.1rem';
        }
    }

    /**
     * Recalcule l'expression courante (déclenché lors d'un changement de mode DEG/RAD)
     */
    function recalculate() {
        try {
            const result = evaluate(expression);
            const formattedResult = formatResult(result);
            ecranResultat.textContent = formattedResult;
            updateDisplay();
        } catch (e) {
            ecranResultat.textContent = 'Erreur';
        }
    }

    /**
     * Évalue l'expression actuelle, l'affiche et l'ajoute à l'historique
     */
    function evaluateExpression() {
        if (expression === '') return;
        
        try {
            const rawExpr = expression;
            const result = evaluate(rawExpr);
            const formattedResult = formatResult(result);
            
            // Affichage de la formule originale dans la ligne du haut
            ecranFormule.textContent = formatDisplayExpression(rawExpr) + ' =';
            
            // Affichage du résultat
            ecranResultat.textContent = formattedResult;
            
            // Sauvegarde dans l'historique
            const historyItem = {
                expr: formatDisplayExpression(rawExpr),
                res: formattedResult,
                timestamp: Date.now()
            };
            
            historique.unshift(historyItem);
            // Limiter à 50 éléments dans l'historique
            if (historique.length > 50) historique.pop();
            
            localStorage.setItem('calc_history', JSON.stringify(historique));
            renderHistory();
            
            // Préparer l'état pour la suite
            lastResult = result;
            expression = formattedResult.replace(/ /g, ''); // Le résultat devient la nouvelle expression
            isEvaluated = true;
            
            updateDisplay();
        } catch (error) {
            console.error(error);
            ecranResultat.textContent = error.message || 'Erreur';
            isEvaluated = true;
        }
    }

    /**
     * Formate le résultat pour un rendu propre (limitation des décimales, notation exponentielle si trop grand)
     */
    function formatResult(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'Erreur';
        }
        if (!isFinite(value)) {
            return value > 0 ? 'Indéfini' : '-Indéfini'; // ou 'Infinity'
        }
        
        // Si c'est un entier, on le renvoie
        if (Number.isInteger(value)) {
            return value.toString();
        }
        
        // Éliminer les erreurs d'arrondi à virgule flottante (ex: 0.1 + 0.2 = 0.30000000000000004)
        const fixedVal = parseFloat(value.toFixed(12));
        
        // Si le nombre est très proche d'un entier après correction d'arrondi
        if (Number.isInteger(fixedVal)) {
            return fixedVal.toString();
        }
        
        // Formatage standard des décimaux
        const strVal = fixedVal.toString();
        if (strVal.length > 14) {
            // Conversion en notation scientifique si la chaîne est trop longue
            return fixedVal.toExponential(8);
        }
        
        return strVal;
    }

    /**
     * Rendu visuel de la liste de l'historique
     */
    function renderHistory() {
        historyList.innerHTML = '';
        
        if (historique.length === 0) {
            noHistoryMsg.style.display = 'block';
            return;
        }
        
        noHistoryMsg.style.display = 'none';
        
        historique.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.setAttribute('role', 'button');
            li.setAttribute('tabindex', '0');
            li.innerHTML = `
                <span class="history-expr">${item.expr}</span>
                <span class="history-res">${item.res}</span>
            `;
            
            // Clic sur l'élément de l'historique pour le recharger
            const loadHistoryItem = () => {
                // Convertir le résultat affiché en expression interne
                expression = item.res.replace(/ /g, '').replace(/÷/g, '/').replace(/×/g, '*');
                isEvaluated = false;
                updateDisplay();
                ecranResultat.textContent = item.res;
                drawerHistory.classList.remove('open');
            };
            
            li.addEventListener('click', loadHistoryItem);
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadHistoryItem();
                }
            });
            
            historyList.appendChild(li);
        });
    }

    // ==========================================
    // MOTEUR D'ÉVALUATION MATHÉMATIQUE (PARSER)
    // ==========================================

    /**
     * Tokenise la chaîne d'expression mathématique brute.
     */
    function tokenize(str) {
        const tokens = [];
        let i = 0;
        
        while (i < str.length) {
            const char = str[i];
            
            // Espaces blancs
            if (/\s/.test(char)) {
                i++;
                continue;
            }
            
            // Nombres réels (y compris avec virgule)
            if (/[0-9.]/.test(char)) {
                let numStr = '';
                while (i < str.length && /[0-9.]/.test(str[i])) {
                    numStr += str[i];
                    i++;
                }
                if ((numStr.split('.').length - 1) > 1) {
                    throw new Error("Nombre invalide");
                }
                const num = parseFloat(numStr);
                if (isNaN(num)) {
                    throw new Error("Nombre invalide");
                }
                tokens.push({ type: 'NUMBER', value: num });
                continue;
            }
            
            // Constante PI (π)
            if (char === 'π') {
                tokens.push({ type: 'NUMBER', value: Math.PI });
                i++;
                continue;
            }
            
            // Constantes et Fonctions (mots alphabétiques)
            if (/[a-zA-Z]/.test(char)) {
                let word = '';
                while (i < str.length && /[a-zA-Z]/.test(str[i])) {
                    word += str[i];
                    i++;
                }
                
                if (word === 'e') {
                    tokens.push({ type: 'NUMBER', value: Math.E });
                } else if (word === 'Ans') {
                    tokens.push({ type: 'NUMBER', value: lastResult !== null ? lastResult : 0 });
                } else if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(word)) {
                    tokens.push({ type: 'FUNCTION', value: word });
                } else {
                    throw new Error(`Symbole inconnu: ${word}`);
                }
                continue;
            }
            
            // Parenthèses et postfixés
            if (char === '(') {
                tokens.push({ type: 'LPAREN', value: '(' });
                i++;
                continue;
            }
            if (char === ')') {
                tokens.push({ type: 'RPAREN', value: ')' });
                i++;
                continue;
            }
            if (char === '!') {
                tokens.push({ type: 'POSTFIX_OP', value: '!' });
                i++;
                continue;
            }
            
            // Opérateurs binaires
            if (['+', '-', '*', '/', '%', '^'].includes(char)) {
                tokens.push({ type: 'OPERATOR', value: char });
                i++;
                continue;
            }
            
            throw new Error(`Caractère inconnu: ${char}`);
        }
        
        // --- MULTIPLICATION IMPLICITE ---
        // Insère un opérateur '*' entre deux opérandes adjacents sans opérateur explicite.
        // Cas :
        // - Nombre/Constante suivi de Parenthèse ouvrante (ex: 2(3+4) -> 2*(3+4))
        // - Nombre/Constante suivi de Fonction (ex: 2sin(30) -> 2*sin(30))
        // - Parenthèse fermante suivie de Nombre/Constante (ex: (2)3 -> (2)*3)
        // - Parenthèse fermante suivie de Parenthèse ouvrante (ex: (2)(3) -> (2)*(3))
        // - Parenthèse fermante suivie de Fonction (ex: (2)sin(30) -> (2)*sin(30))
        // - Nombre/Constante suivi d'une autre Constante (ex: π e -> π * e)
        // - Postfixe '!' suivi d'un Nombre/Constante/Fonction/Parenthèse (ex: 3!2 -> 3!*2)
        const processedTokens = [];
        for (let j = 0; j < tokens.length; j++) {
            const curr = tokens[j];
            processedTokens.push(curr);
            
            if (j < tokens.length - 1) {
                const next = tokens[j + 1];
                
                const isCurrOperand = (curr.type === 'NUMBER' || curr.type === 'RPAREN' || curr.type === 'POSTFIX_OP');
                const isNextOperand = (next.type === 'NUMBER' || next.type === 'LPAREN' || next.type === 'FUNCTION');
                
                if (isCurrOperand && isNextOperand) {
                    processedTokens.push({ type: 'OPERATOR', value: '*' });
                }
            }
        }
        
        // --- OPÉRATEURS UNABIRES (+/-) ---
        // Transforme '+' ou '-' en opérateur unaire s'il est au début de l'expression
        // ou immédiatement après un autre opérateur ou une parenthèse ouvrante.
        const finalTokens = [];
        for (let j = 0; j < processedTokens.length; j++) {
            const curr = processedTokens[j];
            
            if (curr.type === 'OPERATOR' && (curr.value === '-' || curr.value === '+')) {
                const prev = j > 0 ? processedTokens[j - 1] : null;
                if (!prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN') {
                    finalTokens.push({
                        type: 'UNARY_OPERATOR',
                        value: curr.value === '-' ? 'u-' : 'u+'
                    });
                    continue;
                }
            }
            finalTokens.push(curr);
        }
        
        return finalTokens;
    }

    /**
     * Implémente l'algorithme Shunting-Yard pour convertir les tokens infixés en RPN (notation polonaise inverse).
     */
    function shuntingYard(tokens) {
        const outputQueue = [];
        const operatorStack = [];
        
        const precedence = {
            '+': 1, '-': 1,
            '*': 2, '/': 2, '%': 2,
            '^': 3,
            'u-': 4, 'u+': 4,
            '!': 5
        };
        
        const associativity = {
            '+': 'L', '-': 'L',
            '*': 'L', '/': 'L', '%': 'L',
            '^': 'R',
            'u-': 'R', 'u+': 'R',
            '!': 'L'
        };
        
        for (const token of tokens) {
            if (token.type === 'NUMBER') {
                outputQueue.push(token);
            } else if (token.type === 'FUNCTION') {
                operatorStack.push(token);
            } else if (token.type === 'LPAREN') {
                operatorStack.push(token);
            } else if (token.type === 'RPAREN') {
                let hasLparen = false;
                while (operatorStack.length > 0) {
                    const top = operatorStack[operatorStack.length - 1];
                    if (top.type === 'LPAREN') {
                        hasLparen = true;
                        break;
                    }
                    outputQueue.push(operatorStack.pop());
                }
                
                if (!hasLparen) {
                    throw new Error("Parenthèses déséquilibrées");
                }
                operatorStack.pop(); // Enlever la parenthèse '('
                
                // Si le sommet est une fonction, on l'envoie à la sortie
                if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'FUNCTION') {
                    outputQueue.push(operatorStack.pop());
                }
            } else if (token.type === 'OPERATOR' || token.type === 'UNARY_OPERATOR' || token.type === 'POSTFIX_OP') {
                const op1 = token.value;
                while (operatorStack.length > 0) {
                    const top = operatorStack[operatorStack.length - 1];
                    if (top.type !== 'OPERATOR' && top.type !== 'UNARY_OPERATOR' && top.type !== 'POSTFIX_OP') {
                        break;
                    }
                    const op2 = top.value;
                    const p1 = precedence[op1];
                    const p2 = precedence[op2];
                    
                    if ((associativity[op1] === 'L' && p1 <= p2) || (associativity[op1] === 'R' && p1 < p2)) {
                        outputQueue.push(operatorStack.pop());
                    } else {
                        break;
                    }
                }
                operatorStack.push(token);
            }
        }
        
        while (operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1];
            if (top.type === 'LPAREN' || top.type === 'RPAREN') {
                throw new Error("Parenthèses déséquilibrées");
            }
            outputQueue.push(operatorStack.pop());
        }
        
        return outputQueue;
    }

    /**
     * Évalue l'expression en RPN.
     */
    function evaluateRPN(rpnTokens) {
        const stack = [];
        
        for (const token of rpnTokens) {
            if (token.type === 'NUMBER') {
                stack.push(token.value);
            } else if (token.type === 'UNARY_OPERATOR') {
                if (stack.length < 1) throw new Error("Format invalide");
                const val = stack.pop();
                stack.push(token.value === 'u-' ? -val : val);
            } else if (token.type === 'POSTFIX_OP' && token.value === '!') {
                if (stack.length < 1) throw new Error("Format invalide");
                const val = stack.pop();
                stack.push(factorial(val));
            } else if (token.type === 'FUNCTION') {
                if (stack.length < 1) throw new Error("Format invalide");
                const val = stack.pop();
                stack.push(evaluateFunction(token.value, val));
            } else if (token.type === 'OPERATOR') {
                if (stack.length < 2) throw new Error("Format invalide");
                const b = stack.pop();
                const a = stack.pop();
                stack.push(evaluateBinaryOperator(token.value, a, b));
            }
        }
        
        if (stack.length !== 1) {
            throw new Error("Expression incomplète");
        }
        
        return stack[0];
    }

    /**
     * Calcul de factoriel pour les entiers positifs
     */
    function factorial(n) {
        if (n < 0) throw new Error("Factoriel d'un négatif indéfini");
        if (!Number.isInteger(n)) throw new Error("Factoriel d'un décimal indéfini");
        if (n > 170) return Infinity; // Dépassement de capacité double float
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
     * Évalue une fonction scientifique unaire
     */
    function evaluateFunction(func, val) {
        let rad = val;
        // Conversion en radian si mode degré actif pour les fonctions trigo
        if (isDegreeMode && ['sin', 'cos', 'tan'].includes(func)) {
            rad = val * Math.PI / 180;
        }
        
        switch (func) {
            case 'sin':
                const sinVal = Math.sin(rad);
                return Math.abs(sinVal) < 1e-15 ? 0 : sinVal;
                
            case 'cos':
                const cosVal = Math.cos(rad);
                return Math.abs(cosVal) < 1e-15 ? 0 : cosVal;
                
            case 'tan':
                // En mode degré, tan(90) ou tan(270) etc. sont indéfinis (division par zéro)
                if (isDegreeMode && Math.abs(val % 180) === 90) {
                    throw new Error("Indéfini");
                }
                const tanVal = Math.tan(rad);
                return Math.abs(tanVal) < 1e-15 ? 0 : tanVal;
                
            case 'ln':
                if (val <= 0) throw new Error("Hors domaine ln");
                return Math.log(val);
                
            case 'log':
                if (val <= 0) throw new Error("Hors domaine log");
                return Math.log10(val);
                
            case 'sqrt':
                if (val < 0) throw new Error("Hors domaine racine");
                return Math.sqrt(val);
                
            default:
                throw new Error(`Fonction inconnue : ${func}`);
        }
    }

    /**
     * Évalue un opérateur binaire
     */
    function evaluateBinaryOperator(op, a, b) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/':
                if (b === 0) throw new Error("Division par 0");
                return a / b;
            case '%':
                if (b === 0) throw new Error("Modulo par 0");
                return a % b;
            case '^':
                return Math.pow(a, b);
            default:
                throw new Error(`Opérateur inconnu : ${op}`);
        }
    }

    /**
     * Point d'entrée principal pour l'évaluation globale d'une chaîne
     */
    function evaluate(str) {
        // Nettoyage rapide pour les cas limites
        let cleanedStr = str.trim();
        if (cleanedStr === '') return 0;
        
        // Parenthèses non fermées automatiques (très apprécié en cours de saisie, ex: 5 * sin(30 -> 5 * sin(30))
        let lparens = (cleanedStr.match(/\(/g) || []).length;
        let rparens = (cleanedStr.match(/\)/g) || []).length;
        while (lparens > rparens) {
            cleanedStr += ')';
            rparens++;
        }
        
        const tokens = tokenize(cleanedStr);
        const rpn = shuntingYard(tokens);
        return evaluateRPN(rpn);
    }
});
