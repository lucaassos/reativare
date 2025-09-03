document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // O usuário está logado, podemos executar a lógica da página
            if (window.location.pathname.endsWith('dashboard.html')) {
                initDashboard();
            } else if (window.location.pathname.endsWith('treino.html')) {
                initTreinoPage();
            }
        }
    });
});

// --- LÓGICA DO DASHBOARD ---
function initDashboard() {
    const clientList = document.getElementById('client-list');
    const modal = document.getElementById('client-modal');
    const addClientButton = document.getElementById('add-client-button');
    const closeButton = document.querySelector('.close-button');
    const addClientForm = document.getElementById('add-client-form');

    // Abrir e fechar modal
    addClientButton.onclick = () => modal.style.display = 'block';
    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Adicionar cliente
    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('client-name').value;
        const clientObjective = document.getElementById('client-objective').value;

        db.collection('clientes').add({
            nome: clientName,
            objetivo: clientObjective,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            modal.style.display = 'none';
            addClientForm.reset();
        }).catch(error => console.error("Erro ao adicionar cliente:", error));
    });

    // Carregar e ouvir por atualizações na lista de clientes
    db.collection('clientes').orderBy('nome').onSnapshot(snapshot => {
        clientList.innerHTML = ''; // Limpa a lista para redesenhar
        snapshot.forEach(doc => {
            const client = doc.data();
            const clientId = doc.id;
            const card = `
                <div class="client-card">
                    <div class="info">
                        <h3>${client.nome}</h3>
                        <p>${client.objetivo}</p>
                    </div>
                    <div class="actions">
                        <a href="treino.html?id=${clientId}" class="btn">Ver Treino</a>
                        <button class="btn btn-danger" data-id="${clientId}">Excluir</button>
                    </div>
                </div>
            `;
            clientList.innerHTML += card;
        });

        // Adicionar eventos de clique para os botões de exclusão
        document.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir este cliente e todos os seus treinos?')) {
                    db.collection('clientes').doc(id).delete()
                        .catch(error => console.error("Erro ao excluir cliente:", error));
                }
            });
        });
    });
}

// --- LÓGICA DA PÁGINA DE TREINO ---
function initTreinoPage() {
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');

    if (!clienteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const clientHeader = document.getElementById('client-header');
    const addExerciseForm = document.getElementById('add-exercise-form');
    const exerciseList = document.getElementById('exercise-list');

    // Carregar dados do cliente
    db.collection('clientes').doc(clienteId).get().then(doc => {
        if (doc.exists) {
            const client = doc.data();
            clientHeader.innerHTML = `
                <h2>${client.nome}</h2>
                <p>Objetivo: ${client.objetivo}</p>
            `;
        } else {
            console.error("Cliente não encontrado!");
        }
    });

    // Adicionar exercício
    addExerciseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const exerciseData = {
            nome: document.getElementById('exercise-name').value,
            series: document.getElementById('exercise-series').value,
            repeticoes: document.getElementById('exercise-reps').value,
            observacoes: document.getElementById('exercise-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('clientes').doc(clienteId).collection('exercicios').add(exerciseData)
            .then(() => addExerciseForm.reset())
            .catch(error => console.error("Erro ao adicionar exercício:", error));
    });

    // Carregar e ouvir por atualizações nos exercícios
    db.collection('clientes').doc(clienteId).collection('exercicios').orderBy('createdAt').onSnapshot(snapshot => {
        if (snapshot.empty) {
            exerciseList.innerHTML = "<p>Nenhum exercício cadastrado ainda.</p>";
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Exercício</th>
                        <th>Séries</th>
                        <th>Repetições</th>
                        <th>Observações</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;
        snapshot.forEach(doc => {
            const exercise = doc.data();
            const exerciseId = doc.id;
            tableHTML += `
                <tr>
                    <td>${exercise.nome}</td>
                    <td>${exercise.series}</td>
                    <td>${exercise.repeticoes}</td>
                    <td>${exercise.observacoes}</td>
                    <td><button class="btn btn-danger btn-sm" data-id="${exerciseId}">Excluir</button></td>
                </tr>
            `;
        });
        tableHTML += '</tbody></table>';
        exerciseList.innerHTML = tableHTML;

        // Adicionar eventos de clique para os botões de exclusão de exercício
        document.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                db.collection('clientes').doc(clienteId).collection('exercicios').doc(id).delete()
                    .catch(error => console.error("Erro ao excluir exercício:", error));
            });
        });
    });
}
