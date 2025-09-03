document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');

    // Monitorar o estado da autenticação
    auth.onAuthStateChanged(user => {
        const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        
        if (user) {
            // Se o usuário está logado e na página de login, redireciona para o dashboard
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Se o usuário não está logado e não está na página de login, redireciona para o login
            if (!isLoginPage) {
                window.location.href = 'index.html';
            }
        }
    });

    // Evento de submit do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');

            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Login bem-sucedido
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    errorMessage.textContent = 'Email ou senha inválidos.';
                    console.error("Erro no login:", error);
                });
        });
    }

    // Evento de clique no botão de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            }).catch(error => {
                console.error("Erro no logout:", error);
            });
        });
    }
});
