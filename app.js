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
            } else if (path.endsWith('perfil.html')) {
                initPerfilPage();
            }
        }
    });
});

// --- LÓGICA DO DASHBOARD (COM BOTÕES ATUALIZADOS) ---
function initDashboard() {
    const clientList = document.getElementById('client-list');
    const modal = document.getElementById('client-modal');
    const addClientButton = document.getElementById('add-client-button');
    const closeButton = document.querySelector('.close-button');
    const addClientForm = document.getElementById('add-client-form');
    const searchBar = document.getElementById('search-bar');

    let allClients = []; 

    addClientButton.onclick = () => modal.style.display = 'block';
    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientData = {
            nome: document.getElementById('client-name').value,
            objetivo: document.getElementById('client-objective').value,
            queixas: document.getElementById('client-complaints').value,
            diagnostico: document.getElementById('client-diagnosis').value,
            observacoes: document.getElementById('client-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('clientes').add(clientData).then(() => {
            modal.style.display = 'none';
            addClientForm.reset();
        }).catch(error => console.error("Erro ao adicionar cliente:", error));
    });

    db.collection('clientes').orderBy('nome').onSnapshot(snapshot => {
        allClients = [];
        snapshot.forEach(doc => {
            allClients.push({ id: doc.id, ...doc.data() });
        });
        renderClients(allClients);
    });
    
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredClients = allClients.filter(client => {
            return client.nome.toLowerCase().includes(searchTerm);
        });
        renderClients(filteredClients);
    });
    
    function renderClients(clients) {
        clientList.innerHTML = '';
        if (clients.length === 0) {
            clientList.innerHTML = `<p style="text-align: center;">Nenhum cliente encontrado.</p>`;
            return;
        }
        clients.forEach(client => {
            const card = `
                <div class="client-card">
                    <div class="info">
                        <h3>${client.nome}</h3>
                        <p>${client.objetivo}</p>
                    </div>
                    <div class="actions">
                        <a href="perfil.html?id=${client.id}" class="btn btn-secondary">Ver Perfil</a>
                        <a href="treino.html?id=${client.id}" class="btn btn-outline">Ver Treino</a>
                    </div>
                </div>
            `;
            clientList.innerHTML += card;
        });
    }
}


// --- LÓGICA DA PÁGINA DE PERFIL ---
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
    const complaintsInput = document.getElementById('profile-complaints');
    const diagnosisInput = document.getElementById('profile-diagnosis');
    const notesInput = document.getElementById('profile-notes');
    const successMessage = document.getElementById('success-message');
    const deleteButton = document.getElementById('delete-client-button');

    db.collection('clientes').doc(clienteId).get().then(doc => {
        if (doc.exists) {
            const client = doc.data();
            profileHeader.innerHTML = `<h2>Perfil de ${client.nome}</h2>`;
            nameInput.value = client.nome;
            objectiveInput.value = client.objetivo;
            complaintsInput.value = client.queixas || '';
            diagnosisInput.value = client.diagnostico || '';
            notesInput.value = client.observacoes || '';
        } else {
            alert('Cliente não encontrado!');
            window.location.href = 'dashboard.html';
        }
    });

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedData = {
            nome: nameInput.value,
            objetivo: objectiveInput.value,
            queixas: complaintsInput.value,
            diagnostico: diagnosisInput.value,
            observacoes: notesInput.value
        };
        db.collection('clientes').doc(clienteId).update(updatedData)
            .then(() => {
                profileHeader.innerHTML = `<h2>Perfil de ${updatedData.nome}</h2>`;
                successMessage.textContent = 'Perfil atualizado com sucesso!';
                successMessage.style.opacity = 1;
                setTimeout(() => {
                    successMessage.style.opacity = 0;
                }, 3000);
            })
            .catch(error => {
                console.error("Erro ao atualizar perfil:", error);
                alert("Ocorreu um erro ao salvar. Tente novamente.");
            });
    });

    deleteButton.addEventListener('click', () => {
        const clientName = nameInput.value;
        if (confirm(`ATENÇÃO: Você está prestes a excluir permanentemente o cliente "${clientName}".\n\nTodos os dados, incluindo os treinos, serão perdidos.\n\nDeseja continuar?`)) {
            db.collection('clientes').doc(clienteId).delete()
                .then(() => {
                    alert(`Cliente "${clientName}" excluído com sucesso.`);
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    console.error("Erro ao excluir cliente:", error);
                    alert("Ocorreu um erro ao excluir o cliente.");
                });
        }
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
        const templateNode = day-template.content.cloneNode(true);
        
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
            let tableHTML = `<table><thead><tr><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Carga</th><th>Alerta</th><th>Ação</th></tr></thead><tbody>`;
            snapshot.forEach(doc => {
                const ex = doc.data();
                
                let alertIconHTML = '';
                if (ex.createdAt) {
                    const exerciseTime = ex.createdAt.toDate();
                    const now = new Date();
                    const diffMinutes = (now.getTime() - exerciseTime.getTime()) / (1000 * 60);

                    if (diffMinutes > 5) {
                        alertIconHTML = `
                            <div class="alert-icon" title="Considere aumentar a carga para este exercício.">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                                </svg>
                                <span class="tooltip">Considere aumentar a carga.</span>
                            </div>
                        `;
                    }
                }
                
                tableHTML += `
                    <tr>
                        <td>${ex.nomeExercicio}</td>
                        <td>${ex.series}</td>
                        <td>${ex.repeticoes}</td>
                        <td>${ex.carga || '-'}</td>
                        <td class="alert-cell">${alertIconHTML}</td>
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
