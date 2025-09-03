document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            const path = window.location.pathname;
            if (path.endsWith('dashboard.html')) {
                initDashboard();
            } else if (path.endsWith('treino.html')) {
                initTreinoPage();
            } else if (path.endsWith('exercicios.html')) {
                initExerciciosPage();
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

    addClientButton.onclick = () => modal.style.display = 'block';
    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('client-name').value;
        const clientObjective = document.getElementById('client-objective').value;
        const clientNotes = document.getElementById('client-notes').value;

        db.collection('clientes').add({
            nome: clientName,
            objetivo: clientObjective,
            observacoes: clientNotes,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            modal.style.display = 'none';
            addClientForm.reset();
        }).catch(error => console.error("Erro ao adicionar cliente:", error));
    });

    db.collection('clientes').orderBy('nome').onSnapshot(snapshot => {
        clientList.innerHTML = '';
        if (snapshot.empty) {
            clientList.innerHTML = `<p style="text-align: center;">Nenhum cliente cadastrado. Clique em "Adicionar Cliente" para começar.</p>`;
            return;
        }
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

        document.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir este cliente?')) {
                    db.collection('clientes').doc(id).delete()
                        .catch(error => console.error("Erro ao excluir cliente:", error));
                }
            });
        });
    });
}

// --- LÓGICA DA PÁGINA DE BIBLIOTECA DE EXERCÍCIOS ---
function initExerciciosPage() {
    const form = document.getElementById('add-base-exercise-form');
    const exerciseListDiv = document.getElementById('base-exercise-list');

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('base-exercise-name').value;
        const grupo = document.getElementById('base-exercise-group').value;

        db.collection('exercicios_base').add({
            nome: nome,
            grupoMuscular: grupo,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            form.reset();
        }).catch(error => console.error("Erro ao salvar exercício:", error));
    });

    db.collection('exercicios_base').orderBy('nome').onSnapshot(snapshot => {
        if (snapshot.empty) {
            exerciseListDiv.innerHTML = "<p>Nenhum exercício na biblioteca.</p>";
            return;
        }
        let html = '<table><thead><tr><th>Exercício</th><th>Grupo Muscular</th><th>Ação</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
            const ex = doc.data();
            html += `
                <tr>
                    <td>${ex.nome}</td>
                    <td>${ex.grupoMuscular}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteBaseExercise('${doc.id}')">Excluir</button></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        exerciseListDiv.innerHTML = html;
    });
}

function deleteBaseExercise(id) {
    if (confirm('Tem certeza que deseja excluir este exercício da biblioteca?')) {
        db.collection('exercicios_base').doc(id).delete();
    }
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
    const exerciseSelect = document.getElementById('exercise-select');

    db.collection('exercicios_base').orderBy('nome').get().then(snapshot => {
        exerciseSelect.innerHTML = '<option value="">Selecione um exercício</option>';
        snapshot.forEach(doc => {
            const ex = doc.data();
            exerciseSelect.innerHTML += `<option value="${doc.id}" data-name="${ex.nome}">${ex.nome}</option>`;
        });
    });

    db.collection('clientes').doc(clienteId).get().then(doc => {
        if (doc.exists) {
            const client = doc.data();
            clientHeader.innerHTML = `
                <h2>${client.nome}</h2>
                <p><strong>Objetivo:</strong> ${client.objetivo}</p>
                <p><strong>Observações:</strong> ${client.observacoes || 'Nenhuma observação.'}</p>
            `;
        } else {
            console.error("Cliente não encontrado!");
        }
    });

    addExerciseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedOption = exerciseSelect.options[exerciseSelect.selectedIndex];
        const exerciseBaseId = selectedOption.value;
        const exerciseName = selectedOption.getAttribute('data-name');

        if (!exerciseBaseId) {
            alert("Por favor, selecione um exercício.");
            return;
        }
        
        const exerciseData = {
            exercicioBaseId: exerciseBaseId,
            nomeExercicio: exerciseName,
            series: document.getElementById('exercise-series').value,
            repeticoes: document.getElementById('exercise-reps').value,
            observacoes: document.getElementById('exercise-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('clientes').doc(clienteId).collection('exercicios').add(exerciseData)
            .then(() => addExerciseForm.reset())
            .catch(error => console.error("Erro ao adicionar exercício ao plano:", error));
    });

    db.collection('clientes').doc(clienteId).collection('exercicios').orderBy('createdAt').onSnapshot(snapshot => {
        if (snapshot.empty) {
            exerciseList.innerHTML = "<p>Nenhum exercício cadastrado para este cliente.</p>";
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
            tableHTML += `
                <tr>
                    <td>${exercise.nomeExercicio}</td>
                    <td>${exercise.series}</td>
                    <td>${exercise.repeticoes}</td>
                    <td>${exercise.observacoes}</td>
                    <td><button class="btn btn-danger btn-sm" data-id="${doc.id}">Excluir</button></td>
                </tr>
            `;
        });
        tableHTML += '</tbody></table>';
        exerciseList.innerHTML = tableHTML;

        document.querySelectorAll('#exercise-list .btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                db.collection('clientes').doc(clienteId).collection('exercicios').doc(id).delete()
                    .catch(error => console.error("Erro ao excluir exercício:", error));
            });
        });
    });
}
