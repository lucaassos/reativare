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
            } else if (path.endsWith('perfil.html')) { // <-- NOVA ROTA
                initPerfilPage();
            }
        }
    });
});

// --- LÓGICA DO DASHBOARD (COM LINK PARA PERFIL) ---
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
            // CARD ATUALIZADO COM BOTÃO DE PERFIL
            const card = `
                <div class="client-card">
                    <div class="info">
                        <h3>${client.nome}</h3>
                        <p>${client.objetivo}</p>
                    </div>
                    <div class="actions">
                        <a href="perfil.html?id=${clientId}" class="btn btn-secondary">Ver Perfil</a>
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

// --- LÓGICA DA PÁGINA DE PERFIL (NOVA FUNÇÃO) ---
function initPerfilPage() {
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');
    if (!clienteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const profileHeader = document.getElementById('client-profile-header');
    const profileForm = document.getElementById('profile-form');
    const nameInput = document.getElementById('profile-name');
    const objectiveInput = document.getElementById('profile-objective');
    const notesInput = document.getElementById('profile-notes');
    const successMessage = document.getElementById('success-message');

    // Carrega os dados do cliente e preenche o formulário
    db.collection('clientes').doc(clienteId).get().then(doc => {
        if (doc.exists) {
            const client = doc.data();
            profileHeader.innerHTML = `<h2>Perfil de ${client.nome}</h2>`;
            nameInput.value = client.nome;
            objectiveInput.value = client.objetivo;
            notesInput.value = client.observacoes || '';
        } else {
            alert('Cliente não encontrado!');
            window.location.href = 'dashboard.html';
        }
    });

    // Salva as alterações no perfil
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const updatedData = {
            nome: nameInput.value,
            objetivo: objectiveInput.value,
            observacoes: notesInput.value
        };

        db.collection('clientes').doc(clienteId).update(updatedData)
            .then(() => {
                profileHeader.innerHTML = `<h2>Perfil de ${updatedData.nome}</h2>`;
                successMessage.textContent = 'Perfil atualizado com sucesso!';
                successMessage.style.opacity = 1;
                // Esconde a mensagem após alguns segundos
                setTimeout(() => {
                    successMessage.style.opacity = 0;
                }, 3000);
            })
            .catch(error => {
                console.error("Erro ao atualizar perfil:", error);
                alert("Ocorreu um erro ao salvar. Tente novamente.");
            });
    });
}


// --- LÓGICA DA PÁGINA DE BIBLIOTECA DE EXERCÍCIOS ---
function initExerciciosPage() {
    // (Esta função continua a mesma, sem alterações)
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
    // (Esta função continua a mesma, sem alterações)
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');
    if (!clienteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const clientHeader = document.getElementById('client-header');
    const tabs = document.querySelectorAll('.tab-link');
    const workoutContent = document.getElementById('workout-content');
    const dayTemplate = document.getElementById('day-template');
    let baseExercises = [];

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

    db.collection('exercicios_base').orderBy('nome').get().then(snapshot => {
        snapshot.forEach(doc => {
            baseExercises.push({ id: doc.id, ...doc.data() });
        });
        loadContentForDay('segunda');
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const dayId = tab.getAttribute('data-day');
            loadContentForDay(dayId);
        });
    });

    function loadContentForDay(dayId) {
        workoutContent.innerHTML = '';
        const templateNode = dayTemplate.content.cloneNode(true);
        
        const exerciseSelect = templateNode.querySelector('.exercise-select');
        exerciseSelect.innerHTML = '<option value="">Selecione um exercício</option>';
        baseExercises.forEach(ex => {
            exerciseSelect.innerHTML += `<option value="${ex.id}" data-name="${ex.nome}">${ex.nome}</option>`;
        });
        
        const exerciseListDiv = templateNode.querySelector('.exercise-list');
        const addExerciseForm = templateNode.querySelector('.add-exercise-form');

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
                series: addExerciseForm.querySelector('.exercise-series').value,
                repeticoes: addExerciseForm.querySelector('.exercise-reps').value,
                carga: addExerciseForm.querySelector('.exercise-load').value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId).collection('exercicios').add(exerciseData)
                .then(() => addExerciseForm.reset())
                .catch(error => console.error(`Erro ao adicionar exercício em ${dayId}:`, error));
        });

        db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId).collection('exercicios').orderBy('createdAt').onSnapshot(snapshot => {
            if (snapshot.empty) {
                exerciseListDiv.innerHTML = "<p>Nenhum exercício cadastrado para este dia.</p>";
                return;
            }
            let tableHTML = `<table><thead><tr><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Carga</th><th>Ação</th></tr></thead><tbody>`;
            snapshot.forEach(doc => {
                const ex = doc.data();
                tableHTML += `
                    <tr>
                        <td>${ex.nomeExercicio}</td>
                        <td>${ex.series}</td>
                        <td>${ex.repeticoes}</td>
                        <td>${ex.carga || '-'}</td>
                        <td><button class="btn btn-danger btn-sm" data-id="${doc.id}">Excluir</button></td>
                    </tr>
                `;
            });
            tableHTML += '</tbody></table>';
            exerciseListDiv.innerHTML = tableHTML;

            exerciseListDiv.querySelectorAll('.btn-danger').forEach(button => {
                button.addEventListener('click', (e) => {
                    const exerciseId = e.target.getAttribute('data-id');
                    db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId).collection('exercicios').doc(exerciseId).delete();
                });
            });
        });

        workoutContent.appendChild(templateNode);
    }
}
