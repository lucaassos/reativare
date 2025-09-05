document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');

            errorMessage.textContent = '';
            successMessage.textContent = '';

            // Usar a função do Firebase para criar um novo usuário
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Sucesso!
                    successMessage.textContent = 'Usuário registrado com sucesso!';
                    console.log('Usuário criado:', userCredential.user);
                    registerForm.reset(); // Limpa o formulário
                })
                .catch((error) => {
                    // Trata os erros mais comuns
                    let msg = 'Ocorreu um erro. Tente novamente.';
                    if (error.code == 'auth/weak-password') {
                        msg = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                    } else if (error.code == 'auth/email-already-in-use') {
                        msg = 'Este email já está em uso por outro usuário.';
                    } else if (error.code == 'auth/invalid-email') {
                        msg = 'O formato do email é inválido.';
                    }
                    errorMessage.textContent = msg;
                    console.error("Erro no registro:", error);
                });
        });
    }
});
